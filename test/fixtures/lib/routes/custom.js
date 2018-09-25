

/*
 * Defines a usage for custom middleware
 */

module.exports = function (app) {

  var self = app;
  app.routes.get('/custom', app.useStack('default', function (req, res) {
    res.end('ok');
  }));

  app.routes.get('/listStacks', function (req, res) {
    res.json(app.get('stacks'));
  });

  app.routes.get('/removeStack', function (req, res) {
    self.unregisterStack('sample');
    res.json(app.get('stacks'));
  });
};
