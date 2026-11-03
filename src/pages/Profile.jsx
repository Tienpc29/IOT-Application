import { useEffect, useState } from "react";
import {
  Braces,
  Camera,
  Figma,
  FileText,
  Github,
  LogIn,
  LogOut,
  Pencil,
  Save,
  User,
  UserRound,
  X,
} from "lucide-react";
import Header from "../components/Header.jsx";
import { profile } from "../data/mockData.js";
import api from "../services/api.js";

const storageKey = "iot-profile";

const memberProfile = {
  name: "Nguyễn Văn Member",
  msv: "B23DCCN999",
  username: "member",
  image: "",
  github: "https://github.com/member-demo",
  figma: "https://www.figma.com/",
  postman: "https://www.postman.com/",
  pdf: "/bao-cao-iot.pdf",
};

export default function Profile({ onLogout, username = "admin" }) {
  const activeUsername = String(username || "admin").trim().toLowerCase();
  const isAdmin = activeUsername === "admin";
  const profileStorageKey = `${storageKey}-${activeUsername}`;
  const defaultProfile = isAdmin
    ? { ...profile, username: "admin" }
    : { ...memberProfile, username: activeUsername };

  const [data, setData] = useState(() => {
    const savedValue =
      localStorage.getItem(profileStorageKey) ||
      (isAdmin ? localStorage.getItem(storageKey) : null);
    const saved = JSON.parse(savedValue || "null") || {};
    return {
      ...defaultProfile,
      ...saved,
      username: activeUsername,
      pdf: saved.pdf !== undefined ? saved.pdf : (defaultProfile.pdf || "/bao-cao-iot.pdf"),
    };
  });
  const [editing, setEditing] = useState(false);
  const [loggedIn, setLoggedIn] = useState(
    () => localStorage.getItem("iot_logged_in") !== "false",
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "admin", password: "" });
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [draft, setDraft] = useState(data);

  useEffect(() => {
    if (!isAdmin) return;

    // Only admin uses the real profile from the backend.
    api.getProfile("admin")
      .then((res) => {
        if (res && res.name) {
          setData((prev) => ({ ...prev, ...res }));
          setDraft((prev) => ({ ...prev, ...res }));
        }
      })
      .catch(() => {});
  }, [isAdmin]);

  useEffect(
    () => localStorage.setItem(profileStorageKey, JSON.stringify(data)),
    [data, profileStorageKey],
  );

  const update = (key, value) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 800;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        // Nén ảnh trước khi gửi Base64 để không vượt giới hạn request/database.
        update("image", canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  };
  const save = async (event) => {
    event.preventDefault();
    setData(draft);
    setEditing(false);
    try {
      if (isAdmin) {
        await api.updateProfile(draft, "admin");
      }
    } catch {}
  };
  const handleAuthClick = () => {
    api.logout().catch(() => {});
    onLogout();
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const res = await api.login(loginForm.username, loginForm.password);
      if (res && res.success) {
        setLoggedIn(true);
        localStorage.setItem("iot_logged_in", "true");
        if (res.token) localStorage.setItem("iot_token", res.token);
        if (res.user) {
          localStorage.setItem("iot_username", res.user.username || "admin");
          setData((prev) => ({ ...prev, ...res.user }));
        }
        setShowLoginModal(false);
      } else {
        setLoginError(res.message || "Tên đăng nhập hoặc mật khẩu không đúng!");
      }
    } catch (err) {
      // If backend is offline or error, allow default test login (123456)
      if (loginForm.password === "123456") {
        setLoggedIn(true);
        localStorage.setItem("iot_logged_in", "true");
        setShowLoginModal(false);
      } else {
        setLoginError(err.message || "Mật khẩu không chính xác (mặc định: 123456)");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <Header title="Profile" subtitle="Thông tin sinh viên" />
      <div className="profile-container">
        <div className="profile-card panel">
          <div className="avatar-wrap">
            {data.image ? (
              <img
                className="profile-avatar"
                src={data.image}
                alt="Ảnh sinh viên"
              />
            ) : (
              <div className="avatar-placeholder">
                <UserRound size={72} />{" "}
              </div>
            )}
            {editing && (
              <label className="avatar-upload">
                <Camera size={16} />
                Đổi ảnh
                <input type="file" accept="image/*" onChange={chooseImage} />
              </label>
            )}
          </div>

          {editing ? (
            <form className="profile-info profile-form" onSubmit={save}>
              <span className="eyebrow">CHỈNH SỬA PROFILE</span>
              <div className="profile-form-grid">
                <label>
                  Họ và tên
                  <input
                    value={draft.name}
                    onChange={(event) => update("name", event.target.value)}
                    required
                  />
                </label>
                <label>
                  Mã sinh viên
                  <input
                    value={draft.msv || ""}
                    onChange={(event) => update("msv", event.target.value)}
                  />
                </label>
                <label>
                  Username
                  <input
                    value={draft.username || "admin"}
                    onChange={(event) => update("username", event.target.value)}
                  />
                </label>
                <label>
                  GitHub
                  <input
                    value={draft.github || ""}
                    onChange={(event) => update("github", event.target.value)}
                  />
                </label>
                <label>
                  Figma
                  <input
                    value={draft.figma || ""}
                    onChange={(event) => update("figma", event.target.value)}
                  />
                </label>
                <label>
                  Postman
                  <input
                    value={draft.postman || ""}
                    onChange={(event) => update("postman", event.target.value)}
                  />
                </label>
                <label style={{ gridColumn: "span 2" }}>
                  PDF Báo cáo
                  <input
                    value={draft.pdf || ""}
                    placeholder="Link file PDF báo cáo"
                    onChange={(event) => update("pdf", event.target.value)}
                  />
                </label>
              </div>
              <div className="profile-actions">
                <button className="primary-btn">
                  <Save size={16} />
                  Lưu
                </button>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => {
                    setDraft(data);
                    setEditing(false);
                  }}
                >
                  <X size={16} />
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-info">
              <div className="profile-heading">
                <div>
                  <span className="eyebrow">SINH VIÊN</span>
                  <h2>{data.name}</h2>
                </div>
                <button
                  className="secondary-btn"
                  onClick={() => {
                    setDraft(data);
                    setEditing(true);
                  }}
                >
                  <Pencil size={15} />
                  Chỉnh sửa
                </button>
              </div>
              <div className="profile-links-grid">
                <ProfileLink icon={<UserRound size={19} />} label="Họ và tên">
                  <strong>{data.name}</strong>
                </ProfileLink>
                <ProfileLink
                  icon={<Github size={19} />}
                  label="GitHub dự án"
                  href={data.github}
                >
                  {data.github}
                </ProfileLink>
                <ProfileLink icon={<UserRound size={19} />} label="Mã sinh viên">
                  <strong>{data.msv || "B23DCCN823"}</strong>
                </ProfileLink>
                <ProfileLink
                  icon={<Figma size={19} />}
                  label="Figma"
                  href={data.figma}
                >
                  {data.figma}
                </ProfileLink>
                <ProfileLink icon={<User size={19} />} label="Username">
                  <strong>{data.username || "admin"}</strong>
                </ProfileLink>
                <ProfileLink
                  icon={<Braces size={19} />}
                  label="Postman"
                  href={data.postman}
                >
                  {data.postman}
                </ProfileLink>
                <ProfileLink
                  icon={<FileText size={19} />}
                  label="PDF Báo cáo"
                  href={data.pdf}
                >
                  {data.pdf || "Chưa có liên kết"}
                </ProfileLink>
              </div>
              <button
                className={`auth-btn ${loggedIn ? "logout" : ""}`}
                onClick={handleAuthClick}
              >
                {loggedIn ? (
                  <>
                    <LogOut size={15} />
                    Đăng xuất
                  </>
                ) : (
                  <>
                    <LogIn size={15} />
                    Đăng nhập
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {showLoginModal && (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <div className="login-header">
              <h3>Đăng nhập hệ thống IoT</h3>
              <button
                className="login-close"
                type="button"
                onClick={() => setShowLoginModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form className="login-form" onSubmit={handleLoginSubmit}>
              {loginError && <div className="login-error">{loginError}</div>}
              <label>
                Tên đăng nhập
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, username: e.target.value })
                  }
                  placeholder="admin"
                  required
                />
              </label>
              <label>
                Mật khẩu
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({ ...loginForm, password: e.target.value })
                  }
                  placeholder="••••••"
                  required
                />
              </label>
              <div className="login-actions">
                <button
                  className="primary-btn"
                  type="submit"
                  disabled={isLoggingIn}
                >
                  <LogIn size={16} />
                  {isLoggingIn ? "Đang xác thực..." : "Đăng nhập"}
                </button>
                <button
                  className="secondary-btn"
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function ProfileLink({ icon, label, href, children }) {
  return (
    <div className="profile-link">
      {icon}
      <div>
        <span>{label}</span>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
          </a>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
