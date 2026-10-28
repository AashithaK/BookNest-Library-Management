const BASE_URL = 'http://localhost:3000';

async function handleResponse(response) {
  if (!response.ok) {
    let errorMsg = `HTTP Error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData && errorData.message) {
        errorMsg = errorData.message;
      }
    } catch {
      // ignore json parse failure
    }
    throw new Error(errorMsg);
  }
  return response.json();
}

export const api = {
  // Books CRUD
  getBooks: async () => {
    const res = await fetch(`${BASE_URL}/books`);
    return handleResponse(res);
  },

  getBookById: async (id) => {
    const res = await fetch(`${BASE_URL}/books/${id}`);
    return handleResponse(res);
  },

  addBook: async (book) => {
    const res = await fetch(`${BASE_URL}/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book),
    });
    return handleResponse(res);
  },

  updateBook: async (id, book) => {
    const res = await fetch(`${BASE_URL}/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book),
    });
    return handleResponse(res);
  },

  deleteBook: async (id) => {
    const res = await fetch(`${BASE_URL}/books/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Members CRUD
  getMembers: async () => {
    const res = await fetch(`${BASE_URL}/members`);
    return handleResponse(res);
  },

  getMemberById: async (id) => {
    const res = await fetch(`${BASE_URL}/members/${id}`);
    return handleResponse(res);
  },

  addMember: async (member) => {
    const res = await fetch(`${BASE_URL}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    return handleResponse(res);
  },

  updateMember: async (id, member) => {
    const res = await fetch(`${BASE_URL}/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    return handleResponse(res);
  },

  deleteMember: async (id) => {
    const res = await fetch(`${BASE_URL}/members/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  // Transactions CRUD
  getTransactions: async () => {
    const res = await fetch(`${BASE_URL}/transactions`);
    return handleResponse(res);
  },

  getTransactionById: async (id) => {
    const res = await fetch(`${BASE_URL}/transactions/${id}`);
    return handleResponse(res);
  },

  addTransaction: async (transaction) => {
    const res = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    return handleResponse(res);
  },

  updateTransaction: async (id, transaction) => {
    const res = await fetch(`${BASE_URL}/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    return handleResponse(res);
  },

  deleteTransaction: async (id) => {
    const res = await fetch(`${BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },
};

export default api;
