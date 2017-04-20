// http://www.evanmiller.org/how-not-to-sort-by-average-rating.html
exports.up = function(knex, Promise) {
  return knex.schema.raw(`
      CREATE FUNCTION wilsons(ups numeric, downs numeric) RETURNS numeric LANGUAGE plpgsql IMMUTABLE AS $$
      DECLARE
        z numeric;
        n numeric;
        p numeric;
        l numeric;
        r numeric;
        u numeric;
      BEGIN
        n := ups + downs;
        IF
          n = 0
        THEN
          return 0;
        END IF;
        z := 1.281551565545;
        p := ups::numeric / n;
        l := p + 1 / ( 2 * n) * z * z;
        r := z * sqrt(p * (1 - p) / n + z * z / (4 * n * n));
        u := 1 + 1 / n * z * z;
        RETURN ((l - r) / u);
      END
      $$;
    `);
};

exports.down = function(knex, Promise) {
  return knex.schema.raw(`
      DROP FUNCTION wilsons(ups numeric, downs numeric)
    `);
};
