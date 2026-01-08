export type AuthMeResponse = {
  id: number;
  username: string;
};

export type AuthLoginResponse = {
  access: string;
  refresh: string;
};
