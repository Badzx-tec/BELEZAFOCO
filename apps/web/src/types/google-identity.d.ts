export {};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(options: {
            callback: (response: { credential: string }) => void;
            client_id: string;
            ux_mode?: "popup";
          }): void;
          renderButton(
            element: HTMLElement,
            options: {
              shape?: "pill" | "rectangular";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with";
              theme?: "filled_black" | "outline";
              width?: number;
            }
          ): void;
        };
      };
    };
  }
}
