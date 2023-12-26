const express = require('express');
const Sequelize = require('sequelize');
const hbs = require('hbs');
const bodyParser = require('body-parser');

const app = express();

app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + '/views/partials');

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.json());

app.use(express.static('public'));

const sequelize = new Sequelize({
	storage: 'exam.db',
	dialect: 'sqlite',
});

const Film = sequelize.define('film', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	title: {
		type: Sequelize.STRING(200),
	},
	year: {
		type: Sequelize.INTEGER,
	},
	directorId: {
		type: Sequelize.INTEGER,
	},
});

const Director = sequelize.define('director', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	name: {
		type: Sequelize.STRING(200),
	},
});

const Actor = sequelize.define('actor', {
	id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
	name: {
		type: Sequelize.STRING(200),
	},
});

const FilmActor = sequelize.define('film_actor', {
	filmId: {
		type: Sequelize.INTEGER,
	},
	actorId: {
		type: Sequelize.INTEGER,
	},
});

Film.belongsTo(Director, { foreignKey: 'directorId' });
Director.hasMany(Film, { foreignKey: 'directorId' });
Actor.hasMany(FilmActor, { foreignKey: 'actorId' });
FilmActor.belongsTo(Film, { foreignKey: 'filmId' });

sequelize.sync().then((result) => {
	console.log('DB is connected!');
});

app.post('/films', async (req, res) => {
    try {
      const { title, year, directorId, actors } = req.body;
      const film = await Film.create({
        title,
        year,
        directorId,
		actors
      });
	  return res.render('films.hbs', { film });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });

app.get('/films', async (req, res) => {
	const films = await Film.findAll({
		include: [
			{
				model: Director,
			},
		],
	});
	return res.render('films.hbs', {
		films,
	});
});

app.get('/film/:id', async (req, res) => {
	try {
	  const id = req.params.id;
	  const film = await Film.findByPk(id);
  
	  if (film) {
		return res.render('film.hbs', { film });
	  } else {
		res.status(404).json({ error: 'No such film' });
	  }
	} catch (e) {
	  res.status(400).json({ message: e.message });
	}
  });

app.put('/films/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const film = await Film.findByPk(id);
		if (!film) {
			return res.status(404).json({
				status: 404,
				message: 'Film not found',
			});
		}
		const { title, year } = req.body;
		await film.update({
			title,
			year,
		});
		return res.status(200).json(film);
	} catch (e) {
		return res.status(400).json({
			message: e.message,
		});
	}
});

app.delete('/films/:id', async (req, res) => {
	try {
		const id = req.params.id;
		const film = await Film.findByPk(id);
		if (!film) {
			return res.status(404).json({
				status: 404,
				message: 'Film not found',
			});
		}
		await film.destroy();
		return res.status(200).json({
			message: 'ok',
		});
	} catch (e) {
		return res.status(400).json({
			message: e.message,
		});
	}
});

const middleware = async (req, res, next) => {
	try {
	  const id = req.params.id;
	  const film = await Film.findByPk(id);
	  if (!film) {
		res.status(404).json({ error: 'No such film' });
	  } else {
		req.film = film;
		next();
	  }
	} catch (e) {
	  res.status(500).json({ error: e.message });
	}
};

const middleware_2 = (req, res, next) => {
	console.log(`Received ${req.method} request at ${req.url}`);
	next();
};

app.use(middleware_2);

app.get('/film/:id', middleware, (req, res) => {
	const film = req.film;
	res.render('film.hbs', { film });
});
  
  
app.post('/director', async (req, res) => {
	console.log(req.body);
	const { name } = req.body;
	const director = await Director.create({ name });
	res.status(201).json({
		director,
	});
});

app.get('/director', async (req, res) => {
	const directors = await Director.findAll({
		include: [
			{
				model: Film,
			},
		],
	});

	return res.render('director.hbs', {
		directors,
	});
});

app.get('/director/:id', async (req, res) => {
	try {
	  const id = req.params.id;
	  const director = await Director.findByPk(id);
   
	  if (!director) {
		res.status(404).json({
		  status: 404,
		  message: 'Director not found',
		});
		return; 
	  }
   	  const films = await Film.findAll({
		where: { directorId: id },
	  });
   
	  return res.render('director.hbs', { director, films });
	} catch (e) {
	  return res.status(400).json({
		message: e.message,
	  });
	}
});
   

app.delete('/director/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const director = await Director.findByPk(id);
      if (!director) {
        return res.status(404).json({
          status: 404,
          message: 'Director not found',
        });
      }
      await director.destroy();
      return res.status(200).json({
        message: 'ok',
      });
    } catch (e) {
      return res.status(400).json({
        message: e.message,
      });
    }
});

app.put('/director/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const director = await Director.findByPk(id);
      if (!director) {
        return res.status(404).json({
          status: 404,
          message: 'Director not found',
        });
      }
      const { name, birthYear } = req.body; 
      await director.update({
        name,
        birthYear,
      });
      return res.status(200).json(director);
    } catch (e) {
      return res.status(400).json({
        message: e.message,
      });
    }
});
  
app.post('/actors', async (req, res) => {
	const name = req.body.name;
	const actor = await Actor.create({ name });
	const actors = await Actor.findAll();
	return res.status(201).render('actors.hbs', { actors });
});

app.get('/actors', async (req, res) => {
	const actors = await Actor.findAll({
		include: [
			{
				model: FilmActor,
				include: [
					{
						model: Film,
					},
				],
			},
		],
	});

	return res.render('actors.hbs', {
		actors,
	});
});

app.get('/actor/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const actor = await Actor.findByPk(id, {
        include: [
          {
            model: FilmActor,
            include: [
              {
                model: Film,
              },
            ],
          },
        ],
      });
  
      if (!actor) {
        return res.status(404).json({
          status: 404,
          message: 'Актер не найден',
        });
      }

      const actors = await Actor.findAll({ raw: true }); 
      return res.render('actor.hbs', { actor, actors });
    } catch (e) {
      return res.status(400).json({
        message: e.message,
      });
    }
})
  
app.delete('/actors/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const actor = await Actor.findByPk(id);
      if (!actor) {
        return res.status(404).json({
          status: 404,
          message: 'Актер не найден',
        });
      }
  
      await actor.destroy(); 
      const actors = await Actor.findAll();
      return res.status(200).render('actors.hbs', { actors });
    } catch (e) {
      return res.status(400).json({
        message: e.message,
      });
    }
});

app.put('/actors/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const actor = await Actor.findByPk(id);
      if (!actor) {
        return res.status(404).json({
          status: 404,
          message: 'Актер не найден',
        });
      }
      const { name } = req.body;
      await actor.update({
        name
      });
      const actors = await Actor.findAll();
      return res.status(200).render('actors.hbs', { actors }); 
    } catch (e) {
      return res.status(400).json({
        message: e.message,
      });
    }
});

app.listen(3000, () => {
	console.log('Сервер запущен!');
});