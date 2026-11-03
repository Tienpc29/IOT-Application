import { useState } from "react";
import { LogIn, Loader2, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api.js";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "admin", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.username.trim()) {
      setError("Vui lòng nhập tên đăng nhập");
      return;
    }
    if (!form.password) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }

    setLoading(true);

    try {
      const response = await api.login(form.username, form.password);
      if (!response?.success) {
        throw new Error("Sai tài khoản hoặc mật khẩu");
      }
      onLogin(response.user, response.token);
      navigate("/", { replace: true });
    } catch (err) {
      setError("Sai tài khoản hoặc mật khẩu hoặc backend chưa chạy");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="login-brand-icon">
            <Wifi size={26} />
          </div>
          <div>
            <strong>IOT</strong>
            <span>và ứng dụng</span>
          </div>
        </div>

        <div className="login-title-wrap">
          <h1 id="login-title">Đăng nhập hệ thống</h1>
          <p>Đăng nhập để tiếp tục giám sát và điều khiển thiết bị.</p>
        </div>

        <form className="login-form" onSubmit={submit} noValidate>
          {error && <div className="login-error">{error}</div>}
          <label>
            Tên đăng nhập
            <input
              type="text"
              value={form.username}
              onChange={(event) => update("username", event.target.value)}
              placeholder="admin"
              autoComplete="username"
              autoFocus
              required
            />
          </label>
          <label>
            Mật khẩu
            <input
              type="password"
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              required
            />
          </label>
          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? <Loader2 size={17} className="spin" /> : <LogIn size={17} />}
            {loading ? "Đang xác thực..." : "Đăng nhập"}
          </button>
        </form>
      </section>
    </main>
  );
}
