import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../../api/axiosConfig';
import useServerStore from '../../store/useServerStore';
import useUserStore from '../../store/useUserStore';
import {
  SERVER_PERMISSIONS,
  PERMISSION_GROUPS,
  getMemberRoleIds,
  getPermissionMeta,
  getRoleNamesForMember,
  hasServerPermission,
  sortRoles,
} from '../../utils/serverPermissions';

const EMPTY_ROLE_FORM = {
  name: '',
  permissions: [],
};

const ServerSettingsModal = ({ onClose }) => {
  const {
    currentServer,
    updateServer,
    removeServer,
    updateCurrentServerMember,
    updateCurrentServerMembers,
    removeCurrentServerMember,
    updateCurrentServerRoles,
  } = useServerStore();
  const { currentUser } = useUserStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [name, setName] = useState(currentServer?.name || '');
  const [iconUrl, setIconUrl] = useState(currentServer?.iconUrl || '');
  const [members, setMembers] = useState(currentServer?.members || []);
  const [roles, setRoles] = useState(sortRoles(currentServer?.roles || []));
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingOverview, setIsSavingOverview] = useState(false);
  const [isDeletingServer, setIsDeletingServer] = useState(false);
  const [isLeavingServer, setIsLeavingServer] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [isRolesLoading, setIsRolesLoading] = useState(false);
  const [overviewError, setOverviewError] = useState('');
  const [membersError, setMembersError] = useState('');
  const [rolesError, setRolesError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState(null);
  const [memberRoleDrafts, setMemberRoleDrafts] = useState({});
  const [memberSavingUserId, setMemberSavingUserId] = useState('');
  const [memberRemovingUserId, setMemberRemovingUserId] = useState('');
  const [editingRoleId, setEditingRoleId] = useState('new');
  const [roleForm, setRoleForm] = useState(EMPTY_ROLE_FORM);
  const [isRoleSubmitting, setIsRoleSubmitting] = useState(false);
  const [roleDeletingId, setRoleDeletingId] = useState('');
  const previousServerIdRef = useRef(currentServer?.id || null);

  const canUpdateServer = hasServerPermission(currentServer, SERVER_PERMISSIONS.SERVER_UPDATE);
  const canDeleteServer = hasServerPermission(currentServer, SERVER_PERMISSIONS.SERVER_DELETE);
  const canViewMembers = hasServerPermission(currentServer, SERVER_PERMISSIONS.MEMBER_VIEW)
    || hasServerPermission(currentServer, SERVER_PERMISSIONS.MEMBER_MANAGE);
  const canManageMembers = hasServerPermission(currentServer, SERVER_PERMISSIONS.MEMBER_MANAGE);
  const canViewRoles = hasServerPermission(currentServer, SERVER_PERMISSIONS.ROLE_VIEW)
    || hasServerPermission(currentServer, SERVER_PERMISSIONS.ROLE_MANAGE);
  const canManageRoles = hasServerPermission(currentServer, SERVER_PERMISSIONS.ROLE_MANAGE);
  const isOwner = currentServer?.ownerId === currentUser?.id;
  const currentPermissionList = useMemo(
    () => [...(currentServer?.currentUserPermissions || [])].sort((left, right) => left.localeCompare(right)),
    [currentServer?.currentUserPermissions]
  );

  const assignableRoles = useMemo(
    () => roles.filter((role) => role.id !== 'owner'),
    [roles]
  );

  const tabs = useMemo(() => {
    const nextTabs = [
      { id: 'overview', label: 'Tong quan', description: 'Thong tin va kha nang cua ban' },
    ];

    if (canViewMembers) {
      nextTabs.push({ id: 'members', label: 'Thanh vien', description: 'Danh sach va role thanh vien' });
    }

    if (canViewRoles) {
      nextTabs.push({ id: 'roles', label: 'Role', description: 'Role he thong va role tuy chinh' });
    }

    return nextTabs;
  }, [canViewMembers, canViewRoles]);

  useEffect(() => {
    if (previousServerIdRef.current === currentServer?.id) {
      return;
    }

    previousServerIdRef.current = currentServer?.id || null;
    setName(currentServer?.name || '');
    setIconUrl(currentServer?.iconUrl || '');
    setMembers(currentServer?.members || []);
    setRoles(sortRoles(currentServer?.roles || []));
    setExpandedMemberId(null);
    setMemberRoleDrafts({});
    setEditingRoleId('new');
    setRoleForm(EMPTY_ROLE_FORM);
    setConfirmDelete(false);
    setActiveTab('overview');
  }, [currentServer?.iconUrl, currentServer?.id, currentServer?.members, currentServer?.name, currentServer?.roles]);

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab('overview');
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    if (!currentServer?.id) {
      return undefined;
    }

    let isMounted = true;

    const hydrateServer = async () => {
      setIsSyncing(true);
      setOverviewError('');

      try {
        const res = await api.get(`/servers/${currentServer.id}`);
        if (!isMounted) {
          return;
        }

        updateServer(res.data);
        setMembers(res.data.members || []);
        updateCurrentServerMembers(res.data.members || []);
        const nextRoles = sortRoles(res.data.roles || []);
        setRoles(nextRoles);
        updateCurrentServerRoles(nextRoles);
      } catch (error) {
        if (isMounted) {
          setOverviewError(error.response?.data?.error || 'Khong the dong bo may chu hien tai.');
        }
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    };

    hydrateServer();

    return () => {
      isMounted = false;
    };
  }, [currentServer?.id, updateCurrentServerMembers, updateCurrentServerRoles, updateServer]);

  useEffect(() => {
    if (activeTab !== 'members' || !canViewMembers || !currentServer?.id) {
      return undefined;
    }

    let isMounted = true;

    const fetchMembers = async () => {
      setIsMembersLoading(true);
      setMembersError('');

      try {
        const res = await api.get(`/servers/${currentServer.id}/members`);
        if (!isMounted) {
          return;
        }

        setMembers(res.data);
        updateCurrentServerMembers(res.data);
      } catch (error) {
        if (isMounted) {
          setMembersError(error.response?.data?.error || 'Khong the tai danh sach thanh vien.');
        }
      } finally {
        if (isMounted) {
          setIsMembersLoading(false);
        }
      }
    };

    fetchMembers();

    return () => {
      isMounted = false;
    };
  }, [activeTab, canViewMembers, currentServer?.id, updateCurrentServerMembers]);

  useEffect(() => {
    if (activeTab !== 'roles' || !canViewRoles || !currentServer?.id) {
      return undefined;
    }

    let isMounted = true;

    const fetchRoles = async () => {
      setIsRolesLoading(true);
      setRolesError('');

      try {
        const res = await api.get(`/servers/${currentServer.id}/roles`);
        if (!isMounted) {
          return;
        }

        const nextRoles = sortRoles(res.data);
        setRoles(nextRoles);
        updateCurrentServerRoles(nextRoles);
      } catch (error) {
        if (isMounted) {
          setRolesError(error.response?.data?.error || 'Khong the tai danh sach role.');
        }
      } finally {
        if (isMounted) {
          setIsRolesLoading(false);
        }
      }
    };

    fetchRoles();

    return () => {
      isMounted = false;
    };
  }, [activeTab, canViewRoles, currentServer?.id, updateCurrentServerRoles]);

  if (!currentServer) {
    return null;
  }

  const refreshServerSnapshot = async () => {
    const res = await api.get(`/servers/${currentServer.id}`);
    updateServer(res.data);
    setMembers(res.data.members || []);
    updateCurrentServerMembers(res.data.members || []);
    const nextRoles = sortRoles(res.data.roles || []);
    setRoles(nextRoles);
    updateCurrentServerRoles(nextRoles);
    return res.data;
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    if (!canUpdateServer) {
      return;
    }

    if (!name.trim()) {
      setOverviewError('Ten server khong duoc rong');
      return;
    }

    setIsSavingOverview(true);
    setOverviewError('');

    try {
      const res = await api.put(`/servers/${currentServer.id}`, {
        name: name.trim(),
        iconUrl: iconUrl || null,
      });
      updateServer(res.data);
      onClose();
    } catch (error) {
      setOverviewError(error.response?.data?.error || 'Cap nhat server that bai');
    } finally {
      setIsSavingOverview(false);
    }
  };

  const handleDelete = async () => {
    setIsDeletingServer(true);
    setOverviewError('');

    try {
      await api.delete(`/servers/${currentServer.id}`);
      removeServer(currentServer.id);
      onClose();
    } catch (error) {
      setOverviewError(error.response?.data?.error || 'Xoa server that bai');
      setIsDeletingServer(false);
    }
  };

  const handleLeaveServer = async () => {
    setIsLeavingServer(true);
    setOverviewError('');

    try {
      await api.post(`/servers/${currentServer.id}/leave`);
      removeServer(currentServer.id);
      onClose();
    } catch (error) {
      setOverviewError(error.response?.data?.error || 'Roi server that bai');
      setIsLeavingServer(false);
    }
  };

  const handleToggleMemberEditor = (member) => {
    setExpandedMemberId((currentValue) => (
      currentValue === member.userId ? null : member.userId
    ));
    setMemberRoleDrafts((currentValue) => ({
      ...currentValue,
      [member.userId]: getMemberRoleIds(member),
    }));
  };

  const handleToggleMemberRole = (memberUserId, roleId) => {
    setMemberRoleDrafts((currentValue) => {
      const currentRoles = currentValue[memberUserId] || [];
      const hasRole = currentRoles.includes(roleId);

      return {
        ...currentValue,
        [memberUserId]: hasRole
          ? currentRoles.filter((value) => value !== roleId)
          : [...currentRoles, roleId],
      };
    });
  };

  const handleSaveMemberRoles = async (memberUserId) => {
    setMemberSavingUserId(memberUserId);
    setMembersError('');

    try {
      const res = await api.put(`/servers/${currentServer.id}/members/${memberUserId}/roles`, {
        roleIds: memberRoleDrafts[memberUserId] || [],
      });

      setMembers((currentValue) => currentValue.map((member) => (
        member.userId === memberUserId ? res.data : member
      )));
      updateCurrentServerMember(res.data);
      await refreshServerSnapshot();
      setExpandedMemberId(null);
    } catch (error) {
      setMembersError(error.response?.data?.error || 'Cap nhat role thanh vien that bai.');
    } finally {
      setMemberSavingUserId('');
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    setMemberRemovingUserId(memberUserId);
    setMembersError('');

    try {
      await api.delete(`/servers/${currentServer.id}/members/${memberUserId}`);
      setMembers((currentValue) => currentValue.filter((member) => member.userId !== memberUserId));
      removeCurrentServerMember(memberUserId);
      await refreshServerSnapshot();
    } catch (error) {
      setMembersError(error.response?.data?.error || 'Khong the xoa thanh vien khoi server.');
    } finally {
      setMemberRemovingUserId('');
    }
  };

  const startCreatingRole = () => {
    setEditingRoleId('new');
    setRoleForm(EMPTY_ROLE_FORM);
    setRolesError('');
  };

  const startEditingRole = (role) => {
    setEditingRoleId(role.id);
    setRoleForm({
      name: role.name,
      permissions: [...(role.permissions || [])],
    });
    setRolesError('');
  };

  const handleToggleRolePermission = (permission) => {
    setRoleForm((currentValue) => {
      const hasPermission = currentValue.permissions.includes(permission);

      return {
        ...currentValue,
        permissions: hasPermission
          ? currentValue.permissions.filter((item) => item !== permission)
          : [...currentValue.permissions, permission],
      };
    });
  };

  const handleSubmitRole = async (event) => {
    event.preventDefault();

    if (!canManageRoles) {
      return;
    }

    if (!roleForm.name.trim()) {
      setRolesError('Ten role khong duoc rong');
      return;
    }

    setIsRoleSubmitting(true);
    setRolesError('');

    try {
      if (editingRoleId === 'new') {
        await api.post(`/servers/${currentServer.id}/roles`, {
          name: roleForm.name.trim(),
          permissions: roleForm.permissions,
        });
      } else {
        await api.put(`/servers/${currentServer.id}/roles/${editingRoleId}`, {
          name: roleForm.name.trim(),
          permissions: roleForm.permissions,
        });
      }

      await refreshServerSnapshot();
      startCreatingRole();
    } catch (error) {
      setRolesError(error.response?.data?.error || 'Khong the luu role nay.');
    } finally {
      setIsRoleSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId) => {
    setRoleDeletingId(roleId);
    setRolesError('');

    try {
      await api.delete(`/servers/${currentServer.id}/roles/${roleId}`);
      await refreshServerSnapshot();

      if (editingRoleId === roleId) {
        startCreatingRole();
      }
    } catch (error) {
      setRolesError(error.response?.data?.error || 'Xoa role that bai.');
    } finally {
      setRoleDeletingId('');
    }
  };

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content server-settings-modal" onClick={(event) => event.stopPropagation()}>
        <div className="server-settings-shell">
          <aside className="server-settings-sidebar">
            <div className="server-settings-sidebar__header">
              <span className="server-settings-sidebar__eyebrow">May chu</span>
              <h2 className="server-settings-sidebar__title">{currentServer.name}</h2>
              <p className="server-settings-sidebar__subtitle">
                Quan ly thanh vien, role va kha nang duoc backend cap cho tai khoan nay.
              </p>
            </div>

            <nav className="server-settings-nav">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`server-settings-nav__item ${activeTab === tab.id ? 'is-active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="server-settings-nav__label">{tab.label}</span>
                  <span className="server-settings-nav__hint">{tab.description}</span>
                </button>
              ))}
            </nav>
          </aside>

          <div className="server-settings-main">
            <header className="server-settings-topbar">
              <div>
                <span className="server-settings-topbar__eyebrow">{activeTabMeta?.label}</span>
                <h3 className="server-settings-topbar__title">
                  {activeTab === 'overview' && 'Tong quan may chu'}
                  {activeTab === 'members' && 'Quan ly thanh vien'}
                  {activeTab === 'roles' && 'Role va phan quyen'}
                </h3>
              </div>

              <div className="server-settings-topbar__actions">
                {isSyncing && <span className="server-settings-sync-badge">Dang dong bo</span>}
                <button type="button" className="icon-btn server-settings-close" onClick={onClose} aria-label="Dong cai dat may chu">
                  <CloseIcon />
                </button>
              </div>
            </header>

            <div className="server-settings-body">
              {activeTab === 'overview' && (
                <div className="server-settings-stack">
                  <section className="server-settings-card server-settings-card--hero">
                    <div className="server-settings-hero">
                      <div className="server-settings-hero__badge">
                        {currentServer.iconUrl ? (
                          <img src={currentServer.iconUrl} alt={currentServer.name} className="server-settings-hero__image" />
                        ) : (
                          <span>{getInitial(currentServer.name)}</span>
                        )}
                      </div>

                      <div className="server-settings-hero__meta">
                        <span className="server-settings-hero__eyebrow">Dang truy cap</span>
                        <h4 className="server-settings-hero__title">{currentServer.name}</h4>
                        <p className="server-settings-hero__text">
                          {currentServer.members?.length || members.length} thanh vien, {roles.length} role va {currentPermissionList.length} quyen dang hoat dong.
                        </p>
                      </div>
                    </div>

                    <div className="server-settings-chip-cloud">
                      {currentPermissionList.map((permission) => (
                        <span key={permission} className="server-settings-chip">
                          {getPermissionMeta(permission).label}
                        </span>
                      ))}
                    </div>
                  </section>

                  <section className="server-settings-card">
                    <div className="server-settings-section__header">
                      <div>
                        <h4 className="server-settings-section__title">Khong gian cai dat</h4>
                        <p className="server-settings-section__text">
                          {canUpdateServer
                            ? 'Chinh sua ten va icon de may chu khop voi nhan dien hien tai.'
                            : 'Tai khoan nay dang o che do xem. Ban van co the xem quyen va roi may chu neu can.'}
                        </p>
                      </div>
                    </div>

                    <form className="server-settings-form" onSubmit={handleUpdate}>
                      <div className="server-settings-form__grid">
                        <label className="server-settings-field">
                          <span className="server-settings-field__label">Ten server</span>
                          <input
                            type="text"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            className="server-settings-input"
                            disabled={!canUpdateServer || isSavingOverview}
                          />
                        </label>

                        <label className="server-settings-field">
                          <span className="server-settings-field__label">Icon URL</span>
                          <input
                            type="url"
                            value={iconUrl}
                            onChange={(event) => setIconUrl(event.target.value)}
                            className="server-settings-input"
                            placeholder="https://example.com/icon.png"
                            disabled={!canUpdateServer || isSavingOverview}
                          />
                        </label>
                      </div>

                      {overviewError && <p className="server-settings-feedback server-settings-feedback--error">{overviewError}</p>}

                      <div className="server-settings-actions">
                        <button type="button" onClick={onClose} className="server-settings-secondary-btn">
                          Dong
                        </button>
                        {canUpdateServer && (
                          <button type="submit" className="btn-primary" disabled={isSavingOverview}>
                            {isSavingOverview ? 'Dang luu...' : 'Luu thay doi'}
                          </button>
                        )}
                      </div>
                    </form>
                  </section>

                  <section className="server-settings-card">
                    <div className="server-settings-section__header">
                      <div>
                        <h4 className="server-settings-section__title">Kha nang hien tai</h4>
                        <p className="server-settings-section__text">
                          Day la cac quyen backend dang cap cho tai khoan cua ban trong may chu nay.
                        </p>
                      </div>
                    </div>

                    <div className="server-settings-permission-groups">
                      {PERMISSION_GROUPS.map((group) => {
                        const activePermissions = group.permissions.filter((permission) => currentPermissionList.includes(permission));

                        if (!activePermissions.length) {
                          return null;
                        }

                        return (
                          <article key={group.id} className="server-settings-permission-card">
                            <h5 className="server-settings-permission-card__title">{group.label}</h5>
                            <div className="server-settings-permission-card__list">
                              {activePermissions.map((permission) => {
                                const meta = getPermissionMeta(permission);
                                return (
                                  <div key={permission} className="server-settings-permission-item">
                                    <span className="server-settings-permission-item__label">{meta.label}</span>
                                    <span className="server-settings-permission-item__text">{meta.description}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>

                  <section className="server-settings-card server-settings-card--danger-zone">
                    <div className="server-settings-section__header">
                      <div>
                        <h4 className="server-settings-section__title">Roi hoac xoa may chu</h4>
                        <p className="server-settings-section__text">
                          {isOwner
                            ? 'Owner khong the roi may chu. Ban can xoa server neu muon dong no lai.'
                            : 'Neu roi may chu, ban se bi go khoi danh sach thanh vien va can duoc moi lai de quay tro lai.'}
                        </p>
                      </div>
                    </div>

                    <div className="server-settings-danger-grid">
                      <div className="server-settings-danger-card">
                        <span className="server-settings-danger-card__eyebrow">Thanh vien hien tai</span>
                        <h5 className="server-settings-danger-card__title">Roi may chu</h5>
                        <p className="server-settings-danger-card__text">
                          Ban co the roi khoi may chu bat cu luc nao neu khong con can tham gia nua.
                        </p>
                        <button
                          type="button"
                          className="server-settings-secondary-btn server-settings-secondary-btn--danger"
                          onClick={handleLeaveServer}
                          disabled={isLeavingServer || isOwner}
                        >
                          {isLeavingServer ? 'Dang roi...' : 'Roi may chu'}
                        </button>
                      </div>

                      {canDeleteServer && (
                        <div className="server-settings-danger-card">
                          <span className="server-settings-danger-card__eyebrow">Chi owner</span>
                          <h5 className="server-settings-danger-card__title">Xoa may chu</h5>
                          <p className="server-settings-danger-card__text">
                            Xoa toan bo channel, tin nhan va role trong may chu nay. Hanh dong nay khong the hoan tac.
                          </p>

                          {!confirmDelete ? (
                            <button type="button" className="btn-danger" onClick={() => setConfirmDelete(true)}>
                              Xoa server
                            </button>
                          ) : (
                            <div className="server-settings-danger-actions">
                              <button type="button" className="server-settings-secondary-btn" onClick={() => setConfirmDelete(false)}>
                                Huy
                              </button>
                              <button type="button" className="btn-danger" onClick={handleDelete} disabled={isDeletingServer}>
                                {isDeletingServer ? 'Dang xoa...' : 'Xac nhan xoa'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="server-settings-stack">
                  <section className="server-settings-card">
                    <div className="server-settings-section__header">
                      <div>
                        <h4 className="server-settings-section__title">Thanh vien trong may chu</h4>
                        <p className="server-settings-section__text">
                          Quan sat vai tro cua tung nguoi va cap nhat role neu backend cap quyen MEMBER_MANAGE.
                        </p>
                      </div>
                      <span className="server-settings-count-pill">{members.length} nguoi</span>
                    </div>

                    {membersError && <p className="server-settings-feedback server-settings-feedback--error">{membersError}</p>}
                    {isMembersLoading ? <p className="server-settings-feedback">Dang tai thanh vien...</p> : null}

                    <div className="server-settings-list">
                      {members.map((member) => {
                        const roleNames = getRoleNamesForMember(member, roles);
                        const isCurrentUser = member.userId === currentUser?.id;
                        const isMemberOwner = member.userId === currentServer.ownerId;
                        const draftRoleIds = memberRoleDrafts[member.userId] || getMemberRoleIds(member);

                        return (
                          <article key={member.userId} className="server-settings-list-card">
                            <div className="server-settings-list-card__row">
                              <div className="server-settings-member">
                                <img
                                  src={member.avatarUrl || 'https://via.placeholder.com/40'}
                                  alt={member.displayName}
                                  className="avatar server-settings-member__avatar"
                                />

                                <div className="server-settings-member__meta">
                                  <div className="server-settings-member__headline">
                                    <span className="server-settings-member__name">{member.displayName}</span>
                                    {isCurrentUser && <span className="server-settings-member__badge">Ban</span>}
                                    {isMemberOwner && <span className="server-settings-member__badge server-settings-member__badge--accent">Owner</span>}
                                  </div>
                                  <div className="server-settings-chip-cloud">
                                    {roleNames.map((roleName) => (
                                      <span key={`${member.userId}-${roleName}`} className="server-settings-chip server-settings-chip--subtle">
                                        {roleName}
                                      </span>
                                    ))}
                                  </div>
                                  <span className="server-settings-member__joined">
                                    Tham gia {formatDate(member.joinedAt)}
                                  </span>
                                </div>
                              </div>

                              {canManageMembers && !isMemberOwner && (
                                <div className="server-settings-row-actions">
                                  <button
                                    type="button"
                                    className="server-settings-secondary-btn"
                                    onClick={() => handleToggleMemberEditor(member)}
                                  >
                                    {expandedMemberId === member.userId ? 'Thu gon' : 'Sua role'}
                                  </button>
                                  {!isCurrentUser && (
                                    <button
                                      type="button"
                                      className="server-settings-secondary-btn server-settings-secondary-btn--danger"
                                      onClick={() => handleRemoveMember(member.userId)}
                                      disabled={memberRemovingUserId === member.userId}
                                    >
                                      {memberRemovingUserId === member.userId ? 'Dang xoa...' : 'Xoa khoi server'}
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>

                            {canManageMembers && expandedMemberId === member.userId && (
                              <div className="server-settings-inline-editor">
                                <div className="server-settings-inline-editor__header">
                                  <div>
                                    <h5 className="server-settings-inline-editor__title">Cap nhat role</h5>
                                    <p className="server-settings-inline-editor__text">
                                      Neu bo trong tat ca role, backend se tu dong gan role Member mac dinh.
                                    </p>
                                  </div>
                                </div>

                                <div className="server-settings-checkbox-grid">
                                  {assignableRoles.map((role) => (
                                    <label key={role.id} className="server-settings-checkbox-card">
                                      <input
                                        type="checkbox"
                                        checked={draftRoleIds.includes(role.id)}
                                        onChange={() => handleToggleMemberRole(member.userId, role.id)}
                                      />
                                      <span>
                                        <strong>{role.name}</strong>
                                        <small>{role.systemRole ? 'Role he thong' : `${role.permissions?.length || 0} quyen`}</small>
                                      </span>
                                    </label>
                                  ))}
                                </div>

                                <div className="server-settings-actions">
                                  <button type="button" className="server-settings-secondary-btn" onClick={() => setExpandedMemberId(null)}>
                                    Huy
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => handleSaveMemberRoles(member.userId)}
                                    disabled={memberSavingUserId === member.userId}
                                  >
                                    {memberSavingUserId === member.userId ? 'Dang luu...' : 'Luu role'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'roles' && (
                <div className="server-settings-stack">
                  <section className="server-settings-card">
                    <div className="server-settings-section__header">
                      <div>
                        <h4 className="server-settings-section__title">Bo role cua may chu</h4>
                        <p className="server-settings-section__text">
                          Role he thong duoc khoa, role tuy chinh co the cap nhat neu backend cap ROLE_MANAGE.
                        </p>
                      </div>
                      <span className="server-settings-count-pill">{roles.length} role</span>
                    </div>

                    {rolesError && <p className="server-settings-feedback server-settings-feedback--error">{rolesError}</p>}
                    {isRolesLoading ? <p className="server-settings-feedback">Dang tai role...</p> : null}

                    <div className="server-settings-role-layout">
                      <div className="server-settings-role-column">
                        {roles.map((role) => (
                          <article key={role.id} className="server-settings-list-card">
                            <div className="server-settings-list-card__row">
                              <div>
                                <div className="server-settings-member__headline">
                                  <span className="server-settings-member__name">{role.name}</span>
                                  {role.systemRole && (
                                    <span className="server-settings-member__badge server-settings-member__badge--accent">He thong</span>
                                  )}
                                </div>

                                <div className="server-settings-chip-cloud">
                                  {(role.permissions || []).map((permission) => (
                                    <span key={`${role.id}-${permission}`} className="server-settings-chip server-settings-chip--subtle">
                                      {getPermissionMeta(permission).label}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {canManageRoles && !role.systemRole && (
                                <div className="server-settings-row-actions">
                                  <button type="button" className="server-settings-secondary-btn" onClick={() => startEditingRole(role)}>
                                    Chinh sua
                                  </button>
                                  <button
                                    type="button"
                                    className="server-settings-secondary-btn server-settings-secondary-btn--danger"
                                    onClick={() => handleDeleteRole(role.id)}
                                    disabled={roleDeletingId === role.id}
                                  >
                                    {roleDeletingId === role.id ? 'Dang xoa...' : 'Xoa'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>

                      {canManageRoles && (
                        <form className="server-settings-card server-settings-card--nested" onSubmit={handleSubmitRole}>
                          <div className="server-settings-section__header">
                            <div>
                              <h4 className="server-settings-section__title">
                                {editingRoleId === 'new' ? 'Tao role moi' : 'Cap nhat role tuy chinh'}
                              </h4>
                              <p className="server-settings-section__text">
                                Chon tung quyen se duoc gan cho role nay. Role he thong khong the sua tu frontend.
                              </p>
                            </div>

                            {editingRoleId !== 'new' && (
                              <button type="button" className="server-settings-secondary-btn" onClick={startCreatingRole}>
                                Tao role khac
                              </button>
                            )}
                          </div>

                          <label className="server-settings-field">
                            <span className="server-settings-field__label">Ten role</span>
                            <input
                              type="text"
                              className="server-settings-input"
                              value={roleForm.name}
                              onChange={(event) => setRoleForm((currentValue) => ({ ...currentValue, name: event.target.value }))}
                              placeholder="VD: Moderators"
                            />
                          </label>

                          <div className="server-settings-permission-editor">
                            {PERMISSION_GROUPS.map((group) => (
                              <section key={group.id} className="server-settings-permission-editor__group">
                                <div className="server-settings-permission-editor__header">
                                  <h5>{group.label}</h5>
                                  <span>{group.permissions.filter((permission) => roleForm.permissions.includes(permission)).length}/{group.permissions.length}</span>
                                </div>

                                <div className="server-settings-checkbox-grid">
                                  {group.permissions.map((permission) => {
                                    const meta = getPermissionMeta(permission);
                                    return (
                                      <label key={permission} className="server-settings-checkbox-card">
                                        <input
                                          type="checkbox"
                                          checked={roleForm.permissions.includes(permission)}
                                          onChange={() => handleToggleRolePermission(permission)}
                                        />
                                        <span>
                                          <strong>{meta.label}</strong>
                                          <small>{meta.description}</small>
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </section>
                            ))}
                          </div>

                          <div className="server-settings-actions">
                            <button type="button" className="server-settings-secondary-btn" onClick={startCreatingRole}>
                              Dat lai
                            </button>
                            <button type="submit" className="btn-primary" disabled={isRoleSubmitting}>
                              {isRoleSubmitting ? 'Dang luu...' : editingRoleId === 'new' ? 'Tao role' : 'Luu role'}
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const getInitial = (name = '') => name.trim().charAt(0).toUpperCase() || 'S';

const formatDate = (value) => {
  if (!value) {
    return 'gan day';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'gan day';
  }

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="m6 6 12 12" />
    <path d="M18 6 6 18" />
  </svg>
);

export default ServerSettingsModal;
