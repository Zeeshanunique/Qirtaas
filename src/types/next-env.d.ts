/// <reference types="next" />
/// <reference types="next/image-types/global" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GOOGLE_CLIENT_EMAIL: string
      GOOGLE_PRIVATE_KEY: string
      GOOGLE_DRIVE_FOLDER_ID: string
    }
  }
}

export {}