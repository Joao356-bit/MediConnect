import { supabase } from "@/lib/supabase";

export type Organization = {
  id: string;
  name: string;
  created_by: string;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationMember = {
  organization_id: string;
  user_id: string;
  role: "owner" | "admin" | "professional";
  created_at: string;
};

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Cria uma nova clínica.
 * O trigger do Supabase cria automaticamente o vínculo
 * do usuário autenticado com o papel de owner.
 */
export async function createOrganization(
  name: string,
  userId: string,
): Promise<ServiceResult<Organization>> {
  const normalizedName = name.trim();

  if (!normalizedName) {
    return {
      data: null,
      error: "Informe o nome da clínica.",
    };
  }

  if (!userId) {
    return {
      data: null,
      error: "Usuário não autenticado.",
    };
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: normalizedName,
      created_by: userId,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Erro ao criar organização:", error);

    return {
      data: null,
      error: error.message,
    };
  }

  return {
    data: data as Organization,
    error: null,
  };
}

/**
 * Busca todas as clínicas às quais o usuário autenticado
 * possui vínculo.
 */
export async function getMyOrganizations(): Promise<
  ServiceResult<Organization[]>
> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      data: null,
      error: userError?.message ?? "Usuário não autenticado.",
    };
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select(
      `
      organization_id,
      user_id,
      role,
      created_at,
      organizations (
        id,
        name,
        created_by,
        archived_at,
        created_at,
        updated_at
      )
    `,
    )
    .eq("user_id", userData.user.id);

  if (error) {
    console.error("Erro ao buscar organizações:", error);

    return {
      data: null,
      error: error.message,
    };
  }

  const organizations: Organization[] = (data ?? []).flatMap((membership) => {
    const organization = membership.organizations;

    if (!organization) {
      return [];
    }

    // O relacionamento pode retornar um objeto único.
    return [organization as unknown as Organization];
  });

  return {
    data: organizations,
    error: null,
  };
}

/**
 * Consulta o papel do usuário em uma clínica específica.
 */
export async function getMyOrganizationRole(
  organizationId: string,
): Promise<ServiceResult<OrganizationMember["role"]>> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return {
      data: null,
      error: userError?.message ?? "Usuário não autenticado.",
    };
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: error.message,
    };
  }

  if (!data) {
    return {
      data: null,
      error: "Você não possui vínculo com esta organização.",
    };
  }

  return {
    data: data.role as OrganizationMember["role"],
    error: null,
  };
}
