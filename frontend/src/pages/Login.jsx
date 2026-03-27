import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Eye, EyeSlash, PawPrint } from "@phosphor-icons/react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_e14815e9-182a-412c-afe6-1bef3f9a8c01/artifacts/vf48chjp_seva-logo-1.png";
const HERO_URL = "https://images.unsplash.com/photo-1643786262383-71182213ac13?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjd8MHwxfHNlYXJjaHwyfHxhbmltYWwlMjByZXNjdWUlMjBkb2clMjBzaGVsdGVyfGVufDB8fHx8MTc3NDUxOTgzOHww&ixlib=rb-4.1.0&q=85";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data?.detail || "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Hero Image (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src={HERO_URL}
          alt="Animal rescue"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Manrope' }}>
            Supportive Efforts for Voiceless Animals
          </h2>
          <p className="text-lg text-white/80">
            Managing animal rescue, treatment, and rehabilitation with care and efficiency.
          </p>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#F9FAFB]">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <img src={LOGO_URL} alt="SEVA Logo" className="h-24 w-24 mb-4" />
            <h1 
              className="text-2xl font-bold text-[#1B5E20]"
              style={{ fontFamily: 'Manrope' }}
            >
              SEVA SMS
            </h1>
            <p className="text-[#57534E] text-sm">Shelter Management System</p>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-[#E7E5E4] rounded-lg p-6 sm:p-8">
            <h2 
              className="text-xl font-bold text-[#1C1917] mb-6"
              style={{ fontFamily: 'Manrope' }}
            >
              Sign In
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@seva.org"
                  className="h-14 bg-[#F5F5F4] border-2 border-[#E7E5E4] focus:border-[#4CAF50] focus:bg-white text-base"
                  data-testid="login-email-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-14 bg-[#F5F5F4] border-2 border-[#E7E5E4] focus:border-[#4CAF50] focus:bg-white text-base pr-12"
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
                    data-testid="toggle-password-visibility"
                  >
                    {showPassword ? <EyeSlash size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-[#4CAF50] hover:bg-[#43A047] active:bg-[#388E3C] text-white font-semibold text-base rounded-lg transition-all"
                data-testid="login-submit-button"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing In...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* <p className="text-center text-sm text-[#78716C] mt-6">
              Default: admin@seva.org / Admin@123
            </p> */}
          </div>

          {/* Security Notice */}
          <div className="mt-6 p-4 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg">
            <p className="text-sm text-[#92400E]">
              <strong>Security Notice:</strong> Only one device login is allowed per account. 
              Multiple device logins will result in account blocking.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
