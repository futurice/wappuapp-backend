var util = require('../src/util/seeds');


exports.seed = function(knex, Promise) {
  const cities = {};

  return knex('cities').select('*')
  .then(rows => {
    rows.forEach(city => {
      cities[city.name] = city.id;
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 1,
      city_id: cities['Tampere'],
      name: 'TiTe',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/tite.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 2,
      city_id: cities['Tampere'],
      name: 'Skilta',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/skilta.png'
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 3,
      city_id: cities['Tampere'],
      name: 'Autek',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/autek.png'
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 4,
      city_id: cities['Tampere'],
      name: 'Bioner',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/bioner.png'
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 5,
      city_id: cities['Tampere'],
      name: 'Hiukkanen',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/hiukkanen.png'
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 6,
      city_id: cities['Tampere'],
      name: 'Indecs',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/indecs.png'
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 7,
      city_id: cities['Tampere'],
      name: 'KoRK',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/kork.png'
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 8,
      city_id: cities['Tampere'],
      name: 'Man@ger',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/manager.png'
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 9,
      city_id: cities['Tampere'],
      name: 'MIK',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/mik.png'
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 10,
      city_id: cities['Tampere'],
      name: 'TamArk',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/tamark.png'
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 11,
      city_id: cities['Tampere'],
      name: 'TARAKI',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/taraki.png'
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 12,
      city_id: cities['Tampere'],
      name: 'YKI',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/yki.png'
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 13,
      city_id: cities['Tampere'],
      name: 'TeLE',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/tele.png'
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 14,
      city_id: cities['Tampere'],
      name: 'ESN INTO',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/esn.png'
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 15,
      city_id: cities['Tampere'],
      name: 'Wapputiimi',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/wapputiimi.png'
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 16,
      city_id: cities['Otaniemi'],
      name: 'Arkkitehtikilta',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/ak.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 17,
      city_id: cities['Otaniemi'],
      name: 'Athene',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/athene.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 18,
      city_id: cities['Otaniemi'],
      name: 'AS',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/as.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 19,
      city_id: cities['Otaniemi'],
      name: 'Fyysikkokilta',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/fk.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 20,
      city_id: cities['Otaniemi'],
      name: 'Inkubio',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/inkubio.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 21,
      city_id: cities['Otaniemi'],
      name: 'Kemistikilta',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/kk.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 22,
      city_id: cities['Otaniemi'],
      name: 'Koneinsinöörikilta',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/kik.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 23,
      city_id: cities['Otaniemi'],
      name: 'KY',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/ky.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 24,
      city_id: cities['Otaniemi'],
      name: 'Maanmittarikilta',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/mk.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 25,
      city_id: cities['Otaniemi'],
      name: 'Puunjalostajakilta',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/pjk.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 26,
      city_id: cities['Otaniemi'],
      name: 'Prodeko',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/prodeko.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 27,
      city_id: cities['Otaniemi'],
      name: 'Prosessiteekkarit',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/pt.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 28,
      city_id: cities['Otaniemi'],
      name: 'Rakennusinsinöörikilta',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/ik.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 29,
      city_id: cities['Otaniemi'],
      name: 'Sähköinsinöörikilta',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/sik.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 30,
      city_id: cities['Otaniemi'],
      name: 'Teknologföreningen',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/tf.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 31,
      city_id: cities['Otaniemi'],
      name: 'Tietokilta',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/tik.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 32,
      city_id: cities['Otaniemi'],
      name: 'Vuorimieskilta',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/vk.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 33,
      city_id: cities['Otaniemi'],
      name: 'TOKYO',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/tokyo.png',
    });
  })
  .then(() => {
    return util.insertOrUpdate(knex, 'teams', {
      id: 34,
      city_id: cities['Otaniemi'],
      name: 'AYY',
      image_path: 'https://storage.googleapis.com/wappuapp/assets/ayylogo.png',
    });
  });
};
