const userService = require('./user.service');

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getProfile(req.user.id);
    res.json(user);
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    await userService.changePassword(req.user.id, req.body);
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
};

const getSettings = async (req, res, next) => {
  try {
    const settings = await userService.getSettings(req.user.id);
    res.json(settings);
  } catch (err) { next(err); }
};

const updateSettings = async (req, res, next) => {
  try {
    const settings = await userService.updateSettings(req.user.id, req.body);
    res.json(settings);
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile, changePassword, getSettings, updateSettings };
