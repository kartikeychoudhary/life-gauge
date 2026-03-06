const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { sign } = require('../common/jwt');
const { ConflictError, UnauthorizedError } = require('../common/errors');

const register = async ({ name, email, password }) => {
  const existing = await db('users').where({ email }).first();
  if (existing) throw new ConflictError('Email already in use');

  const password_hash = await bcrypt.hash(password, 12);
  const [id] = await db('users').insert({ name, email, password_hash });
  const user = await db('users').where({ id }).select('id', 'name', 'email').first();

  // Create default settings row
  await db('user_settings').insert({ user_id: id });

  const token = sign({ id: user.id, email: user.email });
  return { token, user };
};

const login = async ({ email, password }) => {
  const user = await db('users').where({ email }).first();
  if (!user) throw new UnauthorizedError('Invalid credentials');

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new UnauthorizedError('Invalid credentials');

  const token = sign({ id: user.id, email: user.email });
  return { token, user: { id: user.id, name: user.name, email: user.email } };
};

module.exports = { register, login };
