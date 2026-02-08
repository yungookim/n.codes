const currentUser = {
  id: 'u1',
  name: 'Sarah Chen',
  email: 'sarah.chen@acme.io',
  role: 'Admin',
  avatar: 'SC'
};

let isAuthenticated = true;

export function getCurrentUser() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (isAuthenticated) {
        resolve({ ...currentUser });
      } else {
        reject(new Error('Not authenticated'));
      }
    }, 80);
  });
}

export function login(email, password) {
  return new Promise((resolve) => {
    setTimeout(() => {
      isAuthenticated = true;
      resolve({ ...currentUser, token: 'mock-jwt-token-xyz' });
    }, 300);
  });
}

export function logout() {
  return new Promise((resolve) => {
    setTimeout(() => {
      isAuthenticated = false;
      resolve({ success: true });
    }, 100);
  });
}
