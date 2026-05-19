import SignupForm from "@/components/auth/SignupForm";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata = {
  title: 'Sign Up — WhatsApp AI',
  description: 'Initialize your AI-native automation workspace.',
}

export default function SignupPage() {
  return <SignupForm />;
}
