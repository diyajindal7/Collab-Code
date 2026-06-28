import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

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

  const {
    register,
    handleSubmit
  } = useForm();

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      const response = await loginUser(data);

      setToken(response.token);
      setUser(response.user);

      navigate("/dashboard");

    } catch (error) {
  console.log("FULL ERROR:", error);
  console.log("RESPONSE:", error.response);
  console.log("DATA:", error.response?.data);

  alert(error.response?.data?.message || "Login Failed");
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
          </div>

          <div>
            <Label>Password</Label>

            <Input
              type="password"
              placeholder="Enter your password"
              {...register("password")}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}