import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../validation/authSchema";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginUser } from "../services/authService";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const navigate = useNavigate();

  const { setUser, setToken } = useAuth();

  const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);
const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(loginSchema),
});

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const response = await loginUser(data);

      setToken(response.token);
      setUser(response.user);

      navigate("/dashboard");

    } catch (error) {
  toast.error(error.response?.data?.message);

}finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-3xl text-center">
          Welcome Back 👋
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >


          
          <div>
            <Label>Email</Label>

           <Input
  type="email"
  placeholder="Enter your email"
  {...register("email")}
/>

{errors.email && (
  <p className="text-red-500 text-sm mt-1">
    {errors.email.message}
  </p>
)}
          </div>

          <div className="relative">
    <Label>Password</Label>

    <Input
  type={showPassword ? "text" : "password"}
  placeholder="Enter password"
  {...register("password")}
/>

{errors.password && (
  <p className="text-red-500 text-sm mt-1">
    {errors.password.message}
  </p>
)}

    <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-9"
    >
        {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
    </button>
</div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Login"}
          </Button>



        </form>
        <p className="mt-5 text-center text-sm text-slate-500">
  Don't have an account?{" "}
  <Link
    to="/register"
    className="font-semibold text-blue-600 hover:underline"
  >
    Register
  </Link>
</p>
      </CardContent>
    </Card>
  );
}
