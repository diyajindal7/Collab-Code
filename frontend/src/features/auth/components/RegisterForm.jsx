import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../validation/authSchema";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { registerUser } from "../services/authService";
import { toast } from "sonner";
export default function RegisterForm() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(registerSchema),
});

  const onSubmit = async (data) => {
  try {
    setLoading(true);

    await registerUser(data);

    toast.success("Account Created Successfully");

    navigate("/");
  } catch (error) {
    console.log(error.response);
    console.log(error.response?.data);

    toast.error(
      error.response?.data?.message || "Registration Failed"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-3xl text-center">
          Create Account 🚀
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >
          <div>
            <Label>Name</Label>

            <Input
              placeholder="Enter your name"
              {...register("name")}
            />
            {errors.name && (
  <p className="text-red-500 text-sm mt-1">
    {errors.name.message}
  </p>
)}
          </div>

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

          <div>
            <Label>Password</Label>

            <Input
              type="password"
              placeholder="Enter your password"
              {...register("password")}
            />
            {errors.password && (
  <p className="text-red-500 text-sm mt-1">
    {errors.password.message}
  </p>
)}
          </div>

          <Button
            className="w-full"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Account"}
          </Button>

          <p className="text-center text-sm">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-blue-500 hover:underline"
            >
              Login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}