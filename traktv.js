var mdb = require('./tmdb.js').Module;
let base_url_image = 'https://image.tmdb.org/t/p/w780';
const Trakt = require('trakt.tv');
let options = {
  client_id: '72bd0fbd3d754f80d0cc1a2db2630258839c2c7bc5ff374681debbf22f08b601',
  client_secret: 'c6045804ab3bec2bcfb850b5bf2a610a7e5ad5c16a89efc86e34d8988efce0bc'
};
const trakt = new Trakt(options);

let Traktv = function () {
  this.movies_trending = movies_trending;
};

let movies_trending = callback => {
  let result_array = [];
  trakt.movies.trending({
    page: 1,
    limit: 10
  }).then(response => {
    let movies_arr = [];
    response.forEach(m => {
      movies_arr.push(mdb.get_movie(m.movie.ids.tmdb));
    });

    Promise.all(movies_arr).then(values => {
      values.forEach(movie => {
        result_array.push({
          title: movie.title,
          overview: movie.overview,
          poster: base_url_image + movie.backdrop_path
        });
      });

      return callback(result_array);
    }, err => {
      //missing movies :(
    });
  }, err => {
    console.log(err);
    return callback(result_array);
  });
};

exports.Module = new Traktv();
