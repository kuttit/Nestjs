export const tenantProfileTemplate = {
  Code: '',
  Name: '',
  Logo: '',
  roleGrp: [
    {
      roleGrpName: '',
      roleGrpCode: '',
      roles: [
        {
          roleCode: '',
          roleName: '',
        },
      ],
    },
  ],
  orgGrp: [
    {
      orgGrpName: '',
      orgGrpCode: '',
      org: [
        {
          orgCode: '',
          orgName: '',
        },
      ],
    },
  ],
  psGrp: [
    {
      psGrpName: '',
      psGrpCode: '',
      ps: [
        {
          psCode: '',
          psName: '',
        },
      ],
    },
  ],
  AG: [
    {
      code: '',
      name: '',
      description: '',
      icon: '',
      APPS: [
        {
          code: '',
          name: '',
          description: '',
          icon: '',
        },
      ],
    },
  ],
  ENV:{
      code: "",
      HostName: "",
      HostIP: "",
      volumePath: "",
  }
};

export const appGroupTemplate = {
  code: '',
  name: '',
  description: '',
  icon: '',
  APPS: [],
};

export const appTemplate = {
  code: '',
  name: '',
  description: '',
  icon: '',
};

export type group = 'role' | 'org' | 'ps' | 'all';
