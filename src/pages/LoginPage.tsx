import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  ShieldCheck,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/api';
import { ApiClientError } from '../api/client';

interface RoleOption {
  role: UserRole;
  label: string;
  headingLabel: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: 'student',
    label: 'Student',
    headingLabel: 'Sign in as a student',
    description: 'Discover books, request holds and manage borrowing.',
    icon: GraduationCap,
  },
  {
    role: 'staff',
    label: 'Staff',
    headingLabel: 'Sign in as library staff',
    description: 'Manage library loans, returns and book collection.',
    icon: BookOpen,
  },
  {
    role: 'admin',
    label: 'Admin',
    headingLabel: 'Sign in as an administrator',
    description: 'Manage accounts, permissions and library oversight.',
    icon: ShieldCheck,
  },
];

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [accountId, setAccountId] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotHint, setShowForgotHint] = useState<boolean>(false);

  const isMockEnabled = import.meta.env.VITE_USE_MOCK !== 'false';
  const activeRoleOption =
    ROLE_OPTIONS.find((r) => r.role === selectedRole) || ROLE_OPTIONS[0];
  const ActiveRoleIcon = activeRoleOption.icon;

  const handleContinueRole = () => {
    setErrorMessage(null);
    setStep(2);
  };

  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!accountId.trim() || !password) {
      setErrorMessage(
        'Please enter both your school account ID and your password.',
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await login({
        accountId: accountId.trim(),
        password,
        role: selectedRole,
      });
      navigate('/');
    } catch (err) {
      if (err instanceof ApiClientError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Unable to sign in right now. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (
    demoAccountId: string,
    demoRole: UserRole,
    demoPassword = 'password123',
  ) => {
    setSelectedRole(demoRole);
    setAccountId(demoAccountId);
    setPassword(demoPassword);
    setErrorMessage(null);
    setStep(2);
  };

  return (
    <div className="py-10 md:py-14 flex flex-col items-center">
      {/* Main Sign-in Split Card matching Figma nodes 26:993 & 26:1065 */}
      <div className="w-full max-w-[1080px] rounded-[16px] border border-brand-border bg-white overflow-hidden grid grid-cols-1 lg:grid-cols-[400px_1fr] min-h-[690px] shadow-[0_2px_12px_rgba(32,59,59,0.03)]">
        {/* Left Welcome Column */}
        <div className="bg-brand-beige flex flex-col">
          <div className="h-[240px] lg:h-[298px] w-full overflow-hidden shrink-0">
            <img
              src="/images/reading-room.png"
              alt="Westbridge School Library reading room"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-8 space-y-4 flex-1">
            <p className="text-[10px] font-semibold tracking-[0.06em] uppercase text-brand-teal">
              YOUR SCHOOL. YOUR LIBRARY.
            </p>
            <h2 className="font-serif text-[29px] leading-[34.8px] text-brand-ink font-normal">
              A little curiosity goes a long way.
            </h2>
            <p className="text-[14px] leading-[23px] text-brand-slate">
              Discover your next read and connect with the Westbridge School
              library.
            </p>
          </div>
        </div>

        {/* Right Interactive Sign-In Column */}
        <div className="p-7 sm:p-10 lg:px-12 lg:py-10 flex flex-col justify-between gap-8">
          <div className="space-y-6">
            {/* 2-Step Progress Indicator */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setStep(1);
                }}
                className="inline-flex items-center gap-2 text-left group"
              >
                {step === 1 ? (
                  <span className="w-6 h-6 rounded-full bg-brand-teal text-white text-[11px] font-semibold flex items-center justify-center">
                    1
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full bg-brand-mint text-brand-teal text-[11px] font-semibold flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                )}
                <span className="text-[12px] font-semibold text-brand-teal group-hover:underline">
                  Choose role
                </span>
              </button>

              <div className="w-12 h-[1px] bg-brand-border" />

              <div className="inline-flex items-center gap-2">
                {step === 2 ? (
                  <span className="w-6 h-6 rounded-full bg-brand-teal text-white text-[11px] font-semibold flex items-center justify-center">
                    2
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full bg-brand-beige text-brand-slate text-[11px] font-semibold flex items-center justify-center">
                    2
                  </span>
                )}
                <span
                  className={`text-[12px] ${
                    step === 2
                      ? 'font-semibold text-brand-teal'
                      : 'font-medium text-brand-slate'
                  }`}
                >
                  Enter credentials
                </span>
              </div>
            </div>

            {step === 1 ? (
              /* STEP 1: Choose Role (Figma 26:993) */
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="font-serif text-[32px] leading-[41px] text-brand-ink font-normal">
                    Welcome to Chapter
                  </h1>
                  <p className="text-[14px] text-brand-slate">
                    Choose your school role to continue to sign in.
                  </p>
                </div>

                {/* Role Cards */}
                <div className="space-y-3" role="radiogroup" aria-label="School role">
                  {ROLE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedRole === opt.role;
                    return (
                      <button
                        key={opt.role}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelectedRole(opt.role)}
                        className={`w-full rounded-[10px] p-4 flex items-center justify-between gap-4 text-left transition-all ${
                          isSelected
                            ? 'bg-brand-mint border-[1.5px] border-brand-teal'
                            : 'bg-white border border-brand-border hover:border-brand-teal/50'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <Icon className="w-5 h-5 text-brand-teal shrink-0" />
                          <div className="space-y-0.5">
                            <p className="text-[14px] font-semibold text-brand-ink">
                              {opt.label}
                            </p>
                            <p className="text-[12.5px] text-brand-slate">
                              {opt.description}
                            </p>
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-brand-teal text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-brand-border shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 text-[12px] text-brand-slate">
                  <Lock className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                  <span>
                    Choose the role assigned to your school account. Selecting a
                    role does not change your permissions.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleContinueRole}
                  className="w-full h-[48px] rounded-[8px] bg-brand-teal hover:bg-brand-tealHover text-white font-semibold text-[14px] inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Continue as {activeRoleOption.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* STEP 2: Enter Credentials (Figma 26:1065) */
              <form onSubmit={handleSubmitCredentials} className="space-y-5">
                <div className="space-y-2">
                  <h1 className="font-serif text-[32px] leading-[41px] text-brand-ink font-normal">
                    {activeRoleOption.headingLabel}
                  </h1>
                  <p className="text-[14px] text-brand-slate">
                    Enter the credentials issued by Westbridge School.
                  </p>
                </div>

                {/* Selected Role Summary Box */}
                <div className="rounded-[8px] bg-brand-mint p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ActiveRoleIcon className="w-5 h-5 text-brand-teal shrink-0" />
                    <div>
                      <p className="text-[11px] text-brand-slate leading-tight">
                        Signing in as
                      </p>
                      <p className="text-[14px] font-semibold text-brand-teal leading-tight mt-0.5">
                        {activeRoleOption.label}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setStep(1);
                    }}
                    className="text-[13px] font-semibold text-brand-teal hover:underline"
                  >
                    Change role
                  </button>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-[8px] bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2.5 text-[13px] text-red-800"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Credential Inputs */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="accountId-input"
                      className="block text-[13px] font-semibold text-brand-ink"
                    >
                      School account ID
                    </label>
                    <input
                      id="accountId-input"
                      type="text"
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      placeholder="Enter your school account ID"
                      autoComplete="username"
                      className="w-full h-[48px] px-3.5 rounded-[8px] border border-brand-border bg-white text-[14px] text-brand-ink placeholder:text-brand-slate focus:outline-none focus:border-brand-teal"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="password-input"
                      className="block text-[13px] font-semibold text-brand-ink"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password-input"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="w-full h-[48px] pl-3.5 pr-11 rounded-[8px] border border-brand-border bg-white text-[14px] text-brand-ink placeholder:text-brand-slate focus:outline-none focus:border-brand-teal"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={
                          showPassword ? 'Hide password' : 'Show password'
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-teal hover:opacity-80"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[12px] pt-0.5">
                    <span className="text-brand-slate">
                      Use your {selectedRole} account, not your email.
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowForgotHint((prev) => !prev)}
                      className="font-semibold text-brand-teal hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {showForgotHint && (
                    <div className="rounded-[8px] bg-brand-amberSurface border border-brand-amberBorder px-3.5 py-2.5 text-[12px] text-brand-amberText">
                      School account passwords are reset by library staff or a
                      school administrator at the library counter.
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-[48px] rounded-[8px] bg-brand-teal hover:bg-brand-tealHover disabled:opacity-60 text-white font-semibold text-[14px] inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <span>
                    {isSubmitting
                      ? 'Signing in...'
                      : `Sign in as ${activeRoleOption.label}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 text-[12px] text-brand-slate">
                  <Lock className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                  <span>
                    Your account must have the {activeRoleOption.label} role
                    assigned by the school.
                  </span>
                </div>
              </form>
            )}
          </div>

          {/* Bottom Help Footer */}
          <div className="border-t border-brand-border pt-4 space-y-1">
            <p className="text-[13px] font-semibold text-brand-ink">
              Need an account or a password reset?
            </p>
            <p className="text-[12px] text-brand-slate">
              Accounts are issued by the school. Ask at the library counter for
              help accessing your account.
            </p>
          </div>
        </div>
      </div>

      {/* Subtle Demo Quick-Fill Helper (Visible only when VITE_USE_MOCK is enabled) */}
      {isMockEnabled && (
        <div className="w-full max-w-[1080px] mt-5 rounded-[12px] border border-brand-border bg-white/80 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div className="flex items-center gap-2 text-brand-ink font-medium">
            <Sparkles className="w-4 h-4 text-brand-teal" />
            <span>Demo Accounts (click to pre-fill credentials):</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('S10428', 'student')}
              className="px-3 py-1.5 rounded-md bg-brand-mint text-brand-teal font-semibold hover:bg-brand-teal hover:text-white transition-colors"
            >
              Maya Chen · S10428 (Student)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('S10312', 'student')}
              className="px-3 py-1.5 rounded-md bg-brand-amberSurface text-brand-amberText font-medium hover:opacity-90 transition-opacity"
            >
              Oliver Brown · S10312 (Overdue Student)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('S10999', 'student')}
              className="px-3 py-1.5 rounded-md bg-gray-100 text-brand-slate font-medium hover:bg-gray-200 transition-colors"
            >
              Liam Patel · S10999 (Inactive)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('STF001', 'staff')}
              className="px-3 py-1.5 rounded-md bg-white border border-brand-border text-brand-ink font-medium hover:border-brand-teal transition-colors"
            >
              Staff · STF001
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
