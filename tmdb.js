const mdb = require('moviedb')('f15f4d77999ae8ae6e442da37edc70b8');
let base_url_image = 'https://image.tmdb.org/t/p/w500';

let TMDB = function () {
  this.get_movie = get_movie;
  this.get_now_playing = get_now_playing;
  this.search_movie = search_movie;
  this.search_show = search_show;
};

let get_movie = (id) => {
  return new Promise((resolve, rej) => {
    mdb.movieInfo({
      id: id,
      language: 'es'
    }, (err, res) => {
      if(err) rej(new Error(String(err)));
      else resolve(res);
    });
  });
};

let get_now_playing = () => {
  return new Promise((resolve, rej) => {
    mdb.miscNowPlayingMovies({
      language: 'es',
      page: 1
    }, (err, res) => {
      if(err) rej(new Error(String(err)));
      else resolve(res.results || []);
    });
  });
};

let search_movie = (text) => {
  return new Promise((resolve, rej) => {
    mdb.searchMovie({
      query: text,
      language: 'es'
    }, (err, res) => {
      console.log(res);
      if(err) rej(new Error(String(err)));
      else resolve(res.results || []);
    });
  })
};

let search_show = (text) => {
  return new Promise((resolve, rej) => {
    mdb.searchTv({
      query: text,
      language: 'es'
    }, (err, res) => {
      console.log(res);
      if(err) rej(new Error(String(err)));
      else resolve(res.results || []);
    });
  })
};

exports.Module = new TMDB();
