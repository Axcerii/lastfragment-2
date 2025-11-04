export const isPasswordValid = (password: string): boolean => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
};

export const isStringLongEnough = (str: string): boolean => {
  const regex = /^.{5,}$/;
  return regex.test(str);
};