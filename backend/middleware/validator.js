const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });

    if (error) {
      // Extract clean human-readable messages — never expose stack traces
      const details = error.details.map(d => d.message.replace(/"/g, '')).join('. ');
      return res.status(400).json({
        success: false,
        data: null,
        message: details,
        error: null
      });
    }

    next();
  };
};

module.exports = validate;
