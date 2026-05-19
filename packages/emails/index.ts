import * as React from "react";
import { Html, Head, Body, Container, Text, Link, Img, Section, Button } from "@react-email/components";

export interface BrandingProps {
  logoUrl?: string;
  primaryColor?: string;
  tenantName?: string;
}

const getStyles = (branding: BrandingProps) => ({
  main: { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" },
  container: { backgroundColor: "#ffffff", padding: "40px", borderRadius: "5px", margin: "40px auto", maxWidth: "600px" },
  h1: { color: branding.primaryColor || "#333", fontSize: "24px", fontWeight: "bold" },
  text: { color: "#555", fontSize: "16px", lineHeight: "24px" },
  btn: { backgroundColor: branding.primaryColor || "#007bee", color: "#fff", padding: "12px 20px", borderRadius: "4px", textDecoration: "none", display: "inline-block" },
  logo: { maxWidth: "150px", marginBottom: "20px" },
});

export const WelcomeEmail = (props: BrandingProps & { name: string; loginUrl: string }) => {
  const styles = getStyles(props);
  return React.createElement(Html, null,
    React.createElement(Head),
    React.createElement(Body, { style: styles.main },
      React.createElement(Container, { style: styles.container },
        props.logoUrl ? React.createElement(Img, { src: props.logoUrl, style: styles.logo }) : null,
        React.createElement(Text, { style: styles.h1 }, `Welcome to ${props.tenantName || "Our Platform"}!`),
        React.createElement(Text, { style: styles.text }, `Hi ${props.name},`),
        React.createElement(Text, { style: styles.text }, "We're thrilled to have you on board. Get started by logging into your account."),
        React.createElement(Section, { style: { textAlign: "center" as const, marginTop: "32px", marginBottom: "32px" } },
          React.createElement(Button, { href: props.loginUrl, style: styles.btn }, "Log In")
        )
      )
    )
  );
};

export const EmailVerification = (props: BrandingProps & { name: string; verifyUrl: string }) => {
  const styles = getStyles(props);
  return React.createElement(Html, null,
    React.createElement(Body, { style: styles.main },
      React.createElement(Container, { style: styles.container },
        props.logoUrl ? React.createElement(Img, { src: props.logoUrl, style: styles.logo }) : null,
        React.createElement(Text, { style: styles.h1 }, "Verify Your Email"),
        React.createElement(Text, { style: styles.text }, `Hi ${props.name}, please verify your email address to continue.`),
        React.createElement(Section, { style: { textAlign: "center" as const, marginTop: "32px" } },
          React.createElement(Button, { href: props.verifyUrl, style: styles.btn }, "Verify Email")
        )
      )
    )
  );
};

export const PasswordReset = (props: BrandingProps & { resetUrl: string }) => {
  const styles = getStyles(props);
  return React.createElement(Html, null,
    React.createElement(Body, { style: styles.main },
      React.createElement(Container, { style: styles.container },
        props.logoUrl ? React.createElement(Img, { src: props.logoUrl, style: styles.logo }) : null,
        React.createElement(Text, { style: styles.h1 }, "Reset Password"),
        React.createElement(Text, { style: styles.text }, "Click the link below to reset your password. If you didn't request this, ignore this email."),
        React.createElement(Section, { style: { textAlign: "center" as const, marginTop: "32px" } },
          React.createElement(Button, { href: props.resetUrl, style: styles.btn }, "Reset Password")
        )
      )
    )
  );
};

export const PaymentSuccess = (props: BrandingProps & { amount: string; invoiceUrl: string }) => {
  const styles = getStyles(props);
  return React.createElement(Html, null,
    React.createElement(Body, { style: styles.main },
      React.createElement(Container, { style: styles.container },
        props.logoUrl ? React.createElement(Img, { src: props.logoUrl, style: styles.logo }) : null,
        React.createElement(Text, { style: styles.h1 }, "Payment Successful"),
        React.createElement(Text, { style: styles.text }, `We've successfully processed your payment of ${props.amount}.`),
        React.createElement(Section, { style: { textAlign: "center" as const, marginTop: "32px" } },
          React.createElement(Button, { href: props.invoiceUrl, style: styles.btn }, "View Invoice")
        )
      )
    )
  );
};

export const PaymentFailed = (props: BrandingProps & { amount: string; updateBillingUrl: string }) => {
  const styles = getStyles(props);
  return React.createElement(Html, null,
    React.createElement(Body, { style: styles.main },
      React.createElement(Container, { style: styles.container },
        props.logoUrl ? React.createElement(Img, { src: props.logoUrl, style: styles.logo }) : null,
        React.createElement(Text, { style: styles.h1 }, "Payment Failed"),
        React.createElement(Text, { style: styles.text }, `We couldn't process your payment of ${props.amount}. Please update your billing information.`),
        React.createElement(Section, { style: { textAlign: "center" as const, marginTop: "32px" } },
          React.createElement(Button, { href: props.updateBillingUrl, style: styles.btn }, "Update Billing Info")
        )
      )
    )
  );
};

export const TrialEnding = (props: BrandingProps & { daysLeft: number; upgradeUrl: string }) => {
  const styles = getStyles(props);
  return React.createElement(Html, null,
    React.createElement(Body, { style: styles.main },
      React.createElement(Container, { style: styles.container },
        props.logoUrl ? React.createElement(Img, { src: props.logoUrl, style: styles.logo }) : null,
        React.createElement(Text, { style: styles.h1 }, "Trial Ending Soon"),
        React.createElement(Text, { style: styles.text }, `Your trial ends in ${props.daysLeft} days. Upgrade now to keep access to all features.`),
        React.createElement(Section, { style: { textAlign: "center" as const, marginTop: "32px" } },
          React.createElement(Button, { href: props.upgradeUrl, style: styles.btn }, "Upgrade Plan")
        )
      )
    )
  );
};

export const SubscriptionCancelled = (props: BrandingProps & { endOfBillingPeriod: string }) => {
  const styles = getStyles(props);
  return React.createElement(Html, null,
    React.createElement(Body, { style: styles.main },
      React.createElement(Container, { style: styles.container },
        props.logoUrl ? React.createElement(Img, { src: props.logoUrl, style: styles.logo }) : null,
        React.createElement(Text, { style: styles.h1 }, "Subscription Cancelled"),
        React.createElement(Text, { style: styles.text }, `Your subscription has been cancelled. You will have access until ${props.endOfBillingPeriod}.`),
      )
    )
  );
};
