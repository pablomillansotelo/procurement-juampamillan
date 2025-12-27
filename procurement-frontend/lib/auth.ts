import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';

const clientId = process.env.AUTH_GITHUB_ID;
const clientSecret = process.env.AUTH_GITHUB_SECRET;

if (!clientId || !clientSecret) {
  throw new Error('GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be defined');
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId,
      clientSecret
    })
  ],
  pages: {
    signIn: '/login' // página personalizada de login
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname === '/login';

      switch (true) {
        // Usuario logueado intentando acceder a /login
        case isLoggedIn && isLoginPage:
          return Response.redirect(new URL('/', nextUrl));

        // Página de login
        case isLoginPage:
          return true;

        // Todas las demás rutas
        default:
          return isLoggedIn;
      }
    }
  }
});

