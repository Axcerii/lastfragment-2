import type { PageServerLoad } from './$types';
export const load: PageServerLoad = async ({ locals }: any) => {
  console.log('Layout: User:', locals.user);
  if (locals.user.id === 0) {
    return { connected: false };
  }

  return {
    connected: true,
    user: locals.user
  };
};