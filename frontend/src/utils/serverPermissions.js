export const SERVER_PERMISSIONS = {
  SERVER_VIEW: 'SERVER_VIEW',
  SERVER_UPDATE: 'SERVER_UPDATE',
  SERVER_DELETE: 'SERVER_DELETE',
  MEMBER_VIEW: 'MEMBER_VIEW',
  MEMBER_MANAGE: 'MEMBER_MANAGE',
  ROLE_VIEW: 'ROLE_VIEW',
  ROLE_MANAGE: 'ROLE_MANAGE',
  CHANNEL_VIEW: 'CHANNEL_VIEW',
  CHANNEL_CREATE: 'CHANNEL_CREATE',
  CHANNEL_UPDATE: 'CHANNEL_UPDATE',
  CHANNEL_DELETE: 'CHANNEL_DELETE',
  MESSAGE_VIEW: 'MESSAGE_VIEW',
  MESSAGE_SEND: 'MESSAGE_SEND',
  MESSAGE_REACT: 'MESSAGE_REACT',
  MESSAGE_MANAGE: 'MESSAGE_MANAGE',
  VOICE_CONNECT: 'VOICE_CONNECT',
};

export const PERMISSION_DETAILS = {
  [SERVER_PERMISSIONS.SERVER_VIEW]: {
    label: 'Xem may chu',
    description: 'Truy cap thong tin co ban va nhin thay may chu trong ung dung.',
  },
  [SERVER_PERMISSIONS.SERVER_UPDATE]: {
    label: 'Cap nhat may chu',
    description: 'Doi ten hoac icon may chu trong cai dat tong quan.',
  },
  [SERVER_PERMISSIONS.SERVER_DELETE]: {
    label: 'Xoa may chu',
    description: 'Xoa vinh vien may chu nay.',
  },
  [SERVER_PERMISSIONS.MEMBER_VIEW]: {
    label: 'Xem thanh vien',
    description: 'Mo danh sach thanh vien va xem ho dang giu role nao.',
  },
  [SERVER_PERMISSIONS.MEMBER_MANAGE]: {
    label: 'Quan ly thanh vien',
    description: 'Moi nguoi, cap nhat role thanh vien va xoa thanh vien khoi may chu.',
  },
  [SERVER_PERMISSIONS.ROLE_VIEW]: {
    label: 'Xem role',
    description: 'Xem role he thong, role tuy chinh va bo quyen cua tung role.',
  },
  [SERVER_PERMISSIONS.ROLE_MANAGE]: {
    label: 'Quan ly role',
    description: 'Tao, sua va xoa role tuy chinh cho may chu.',
  },
  [SERVER_PERMISSIONS.CHANNEL_VIEW]: {
    label: 'Xem channel',
    description: 'Nhin thay danh sach channel thuoc may chu.',
  },
  [SERVER_PERMISSIONS.CHANNEL_CREATE]: {
    label: 'Tao channel',
    description: 'Them channel van ban hoac voice moi.',
  },
  [SERVER_PERMISSIONS.CHANNEL_UPDATE]: {
    label: 'Sua channel',
    description: 'Doi ten va cap nhat thong tin channel.',
  },
  [SERVER_PERMISSIONS.CHANNEL_DELETE]: {
    label: 'Xoa channel',
    description: 'Xoa channel khoi may chu.',
  },
  [SERVER_PERMISSIONS.MESSAGE_VIEW]: {
    label: 'Xem tin nhan',
    description: 'Doc lich su hoi thoai trong cac kenh cho phep.',
  },
  [SERVER_PERMISSIONS.MESSAGE_SEND]: {
    label: 'Gui tin nhan',
    description: 'Gui noi dung moi vao channel van ban.',
  },
  [SERVER_PERMISSIONS.MESSAGE_REACT]: {
    label: 'Tuong tac tin nhan',
    description: 'Them reaction cho tin nhan.',
  },
  [SERVER_PERMISSIONS.MESSAGE_MANAGE]: {
    label: 'Quan ly tin nhan',
    description: 'Xu ly noi dung tin nhan vuot qua quyen gui thong thuong.',
  },
  [SERVER_PERMISSIONS.VOICE_CONNECT]: {
    label: 'Ket noi voice',
    description: 'Tham gia va su dung channel voice.',
  },
};

export const PERMISSION_GROUPS = [
  {
    id: 'server',
    label: 'May chu',
    permissions: [
      SERVER_PERMISSIONS.SERVER_VIEW,
      SERVER_PERMISSIONS.SERVER_UPDATE,
      SERVER_PERMISSIONS.SERVER_DELETE,
    ],
  },
  {
    id: 'members',
    label: 'Thanh vien',
    permissions: [
      SERVER_PERMISSIONS.MEMBER_VIEW,
      SERVER_PERMISSIONS.MEMBER_MANAGE,
    ],
  },
  {
    id: 'roles',
    label: 'Role',
    permissions: [
      SERVER_PERMISSIONS.ROLE_VIEW,
      SERVER_PERMISSIONS.ROLE_MANAGE,
    ],
  },
  {
    id: 'channels',
    label: 'Channel',
    permissions: [
      SERVER_PERMISSIONS.CHANNEL_VIEW,
      SERVER_PERMISSIONS.CHANNEL_CREATE,
      SERVER_PERMISSIONS.CHANNEL_UPDATE,
      SERVER_PERMISSIONS.CHANNEL_DELETE,
    ],
  },
  {
    id: 'messages',
    label: 'Tin nhan',
    permissions: [
      SERVER_PERMISSIONS.MESSAGE_VIEW,
      SERVER_PERMISSIONS.MESSAGE_SEND,
      SERVER_PERMISSIONS.MESSAGE_REACT,
      SERVER_PERMISSIONS.MESSAGE_MANAGE,
    ],
  },
  {
    id: 'voice',
    label: 'Voice',
    permissions: [SERVER_PERMISSIONS.VOICE_CONNECT],
  },
];

const LEGACY_ROLE_TO_IDS = {
  OWNER: ['owner'],
  ADMIN: ['admin'],
  MEMBER: ['member'],
};

const SYSTEM_ROLE_ORDER = ['owner', 'admin', 'member'];

export const normalizePermissions = (permissions = []) => {
  const source = Array.isArray(permissions)
    ? permissions
    : permissions instanceof Set
      ? Array.from(permissions)
      : [];

  return Array.from(new Set(source.filter(Boolean)));
};

export const hasServerPermission = (serverOrPermissions, permission) => {
  if (!permission) {
    return false;
  }

  if (Array.isArray(serverOrPermissions) || serverOrPermissions instanceof Set) {
    return normalizePermissions(serverOrPermissions).includes(permission);
  }

  return normalizePermissions(serverOrPermissions?.currentUserPermissions).includes(permission);
};

export const sortRoles = (roles = []) => {
  return [...roles].sort((left, right) => {
    const leftOrder = SYSTEM_ROLE_ORDER.indexOf(left.id);
    const rightOrder = SYSTEM_ROLE_ORDER.indexOf(right.id);

    if (leftOrder !== -1 || rightOrder !== -1) {
      if (leftOrder === -1) return 1;
      if (rightOrder === -1) return -1;
      return leftOrder - rightOrder;
    }

    if (left.systemRole !== right.systemRole) {
      return left.systemRole ? -1 : 1;
    }

    return left.name.localeCompare(right.name, 'vi', { sensitivity: 'base' });
  });
};

export const getMemberRoleIds = (member) => {
  if (Array.isArray(member?.roleIds) && member.roleIds.length) {
    return Array.from(new Set(member.roleIds.filter(Boolean)));
  }

  return LEGACY_ROLE_TO_IDS[member?.role] || ['member'];
};

export const getRoleNamesForMember = (member, roles = []) => {
  const rolesById = new Map((roles || []).map((role) => [role.id, role]));
  const roleIds = getMemberRoleIds(member);
  const resolvedNames = roleIds
    .map((roleId) => rolesById.get(roleId)?.name)
    .filter(Boolean);

  if (resolvedNames.length) {
    return resolvedNames;
  }

  if (member?.role === 'OWNER') return ['Owner'];
  if (member?.role === 'ADMIN') return ['Admin'];
  return ['Member'];
};

export const getPermissionMeta = (permission) => {
  return PERMISSION_DETAILS[permission] || {
    label: permission,
    description: 'Quyen duoc tra ve tu backend.',
  };
};
