export function validate(schema) {
  return (req, _res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }

      if (parsed.query !== undefined) {
        try {
          req.query = parsed.query;
        } catch {
          Object.defineProperty(req, 'query', {
            value: parsed.query,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        }
      }

      if (parsed.params !== undefined) {
        req.params = parsed.params;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
