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
        // Express 5 makes req.query a getter on Request prototype;
        // Object.defineProperty safely sets it on the request instance
        Object.defineProperty(req, 'query', {
          value: parsed.query,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }

      if (parsed.params !== undefined) {
        Object.defineProperty(req, 'params', {
          value: parsed.params,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }

      req.validated = parsed;
      next();
    } catch (error) {
      next(error);
    }
  };
}
