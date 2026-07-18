import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/LoginForm";

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const passwordInput = document.querySelector('input[type="password"]');
    const passwordField = passwordInput?.closest("div");

    if (!passwordField || passwordField.querySelector("[data-forgot-password-link]")) {
      return;
    }

    const linkWrapper = document.createElement("div");
    linkWrapper.dataset.forgotPasswordLink = "true";
    linkWrapper.className = "mt-2 text-right";

    const link = document.createElement("button");
    link.type = "button";
    link.className = "text-sm font-medium text-blue-400 hover:underline";
    link.textContent = "Forgot Password?";
    link.onclick = () => navigate("/forgot-password");

    linkWrapper.appendChild(link);
    passwordField.appendChild(linkWrapper);

    return () => {
      linkWrapper.remove();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <LoginForm />
    </div>
  );
}
