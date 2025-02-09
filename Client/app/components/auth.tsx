import styles from "./auth.module.scss";
import { IconButton } from "./button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Path, SAAS_CHAT_URL } from "../constant";
import { useAccessStore } from "../store";
import Locale from "../locales";
import Delete from "../icons/close.svg";
import Arrow from "../icons/arrow.svg";
import Logo from "../icons/logo.svg";
import { useMobileScreen } from "@/app/utils";
import BotIcon from "../icons/bot.svg";
import { getClientConfig } from "../config/client";
import { PasswordInput } from "./ui-lib";
import LeftIcon from "@/app/icons/left.svg";
import { safeLocalStorage } from "@/app/utils";
import clsx from "clsx";

// Debugging Helper
const debugLog = (message: string, data?: any) => {
  console.log(`🔍 [AuthPage]: ${message}`, data || "");
};

const storage = safeLocalStorage();

export function AuthPage() {
  const navigate = useNavigate();
  const accessStore = useAccessStore();

  useEffect(() => {
    const clientConfig = getClientConfig();
    debugLog("Client Config Loaded", clientConfig);

    if (clientConfig?.isApp) {
      debugLog("Redirecting to Settings...");
      navigate(Path.Settings);
    }
  }, []);

  const goHome = () => navigate(Path.Home);
  const goChat = () => {
    debugLog("Navigating to Chat Page");
    if (!accessStore.openaiApiKey) {
      alert("⚠️ Please enter an OpenAI API Key before continuing!");
      return;
    }
    navigate(Path.Chat);
  };

  const goSaas = () => {
    debugLog("Redirecting to SAAS Chat URL");
    window.location.href = SAAS_CHAT_URL;
  };

  const resetAccessCode = () => {
    debugLog("Resetting API Keys...");
    accessStore.update((access) => {
      access.openaiApiKey = "";
      access.accessCode = "";
    });
  };

  return (
    <div className={styles["auth-page"]}>
      <TopBanner />
      <div className={styles["auth-header"]}>
        <IconButton icon={<LeftIcon />} text={Locale.Auth.Return} onClick={goHome} />
      </div>

      <div className={clsx("no-dark", styles["auth-logo"])}>
        <BotIcon />
      </div>

      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.Tips}</div>

      {/* Access Code Input */}
      <PasswordInput
        style={{ marginTop: "3vh", marginBottom: "3vh" }}
        aria={Locale.Settings.ShowPassword}
        aria-label={Locale.Auth.Input}
        value={accessStore.accessCode}
        type="text"
        placeholder="Enter Access Code"
        onChange={(e) => accessStore.update((access) => (access.accessCode = e.target.value))}
      />

      {/* OpenAI API Key Input */}
      {!accessStore.hideUserApiKey && (
        <>
          <div className={styles["auth-tips"]}>{Locale.Auth.SubTips}</div>
          <PasswordInput
            style={{ marginTop: "3vh", marginBottom: "3vh" }}
            aria={Locale.Settings.ShowPassword}
            aria-label="OpenAI API Key"
            value={accessStore.openaiApiKey}
            type="text"
            placeholder="Enter OpenAI API Key"
            onChange={(e) => accessStore.update((access) => (access.openaiApiKey = e.target.value))}
          />
          <PasswordInput
            style={{ marginTop: "3vh", marginBottom: "3vh" }}
            aria={Locale.Settings.ShowPassword}
            aria-label="Google API Key"
            value={accessStore.googleApiKey}
            type="text"
            placeholder="Enter Google API Key"
            onChange={(e) => accessStore.update((access) => (access.googleApiKey = e.target.value))}
          />
        </>
      )}

      {/* Action Buttons */}
      <div className={styles["auth-actions"]}>
        <IconButton text="Start Chat" type="primary" onClick={goChat} />
        <IconButton text="Use SAAS Chat" onClick={goSaas} />
      </div>
    </div>
  );
}

function TopBanner() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = useMobileScreen();

  useEffect(() => {
    const bannerDismissed = storage.getItem("bannerDismissed");
    if (!bannerDismissed) {
      storage.setItem("bannerDismissed", "false");
      setIsVisible(true);
    } else if (bannerDismissed === "true") {
      setIsVisible(false);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    storage.setItem("bannerDismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div
      className={styles["top-banner"]}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={clsx(styles["top-banner-inner"], "no-dark")}>
        <Logo className={styles["top-banner-logo"]} />
        <span>
          {Locale.Auth.TopTips}
          <a
            href={SAAS_CHAT_URL}
            rel="noopener noreferrer"
            onClick={() => console.log("SAAS Chat Clicked")}
          >
            {Locale.Settings.Access.SaasStart.ChatNow}
            <Arrow style={{ marginLeft: "4px" }} />
          </a>
        </span>
      </div>
      {(isHovered || isMobile) && <Delete className={styles["top-banner-close"]} onClick={handleClose} />}
    </div>
  );
}
