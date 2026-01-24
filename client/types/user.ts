export type Gender = "man" | "vrouw";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  gender: Gender;
  profileImage?: string;
}

export interface AuthState {
  token: string | null;
  user: UserProfile | null;
}
