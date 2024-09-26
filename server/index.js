const {
  client,
  createTables,
  createUser,
  createProduct,
  fetchUsers,
  fetchProducts,
  addFavorite,
  fetchFavorites,
  deleteFavorites,
  authenticate,
  findUserByToken
} = require('./db');
const express = require('express');
const app = express();
app.use(express.json());

//for deployment only
const path = require('path');
app.get('/', (req, res)=> res.sendFile(path.join(__dirname, '../client/dist/index.html')));
app.use('/assets', express.static(path.join(__dirname, '../client/dist/assets'))); 

const isLoggedIn = async(req, res, next)=> {
  try {
    console.log('Inside is LoggedIn');
    console.log(req.headers);
    req.user = await findUserByToken(req.headers.authorization);
    next();
  }
  catch(ex){
    next(ex);
  }
};

app.post('/api/auth/login', async(req, res, next)=> {
  console.log('Login');
  try {
    res.send(await authenticate(req.body));
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/auth/me', isLoggedIn, (req, res, next)=> {
  console.log('Is inside the AuthMe in INDEX');
  console.log(req.user);
  try {
    res.send(req.user);
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/products', async(req, res, next)=> {
  try {
    res.send(await fetchProducts());
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users', async(req, res, next)=> {
  try {
    res.send(await fetchUsers());
  }
  catch(ex){
    next(ex);
  }
});

app.get('/api/users/:id/favorites', isLoggedIn, async(req, res, next)=> {
  console.log('WE ARE INSIDE FAVORITES FETCH');
  console.log(req.params.id);
  console.log(req.user.id);
  try {
    if(req.params.id !== req.user.id){
      const error = Error('not authorized');
      error.status = 401;
      throw error;
    }
    res.send(await fetchFavorites(req.params.id));
  }
  catch(ex){
    next(ex);
  }
});

app.delete('/api/users/:userId/userSkills/:id', isLoggedIn, async(req, res, next)=> {
  try {
    if(req.params.userId !== req.user.id){
      const error = Error('not authorized');
      error.status = 401;
      throw error;
    }
    await deleteUserSkill({ user_id: req.params.userId, id: req.params.id });
    res.sendStatus(204);
  }
  catch(ex){
    next(ex);
  }
});

app.post('/api/users/:id/favorites', isLoggedIn, async(req, res, next)=> {
  try {
    if(req.params.id !== req.user.id){
      const error = Error('not authorized');
      error.status = 401;
      throw error;
    }
    res.status(201).send(await addFavorite({user_id: req.params.id, product_id: req.body.product_id}));
  }
  catch(ex){
    next(ex);
  }
});

app.use((err, req, res, next)=> {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message || err });
});



const init = async()=> {
  console.log('connecting to database');
  await client.connect();
  console.log('connected to database');
  await createTables();
  
  console.log('tables created');
  const [moe, lucy, larry, ethyl, nintendo, playstation, xbox, gamingComputer] = await Promise.all([
    createUser({ username: 'moe', password: 'moe_pw'}),
    createUser({ username: 'lucy', password: 'lucy_pw'}),
    createUser({ username: 'larry', password: 'larry_pw'}),
    createUser({ username: 'ethyl', password: 'ethyl_pw'}),
    createProduct({ name: 'Nintendo'}),
    createProduct({ name: 'Playstation'}),
    createProduct({ name: 'Xbox'}),
    createProduct({ name: 'Windows Gaming Computer'})
  ]);

  //console.log(await fetchUsers());
  
  //console.log(await fetchProducts());
  //console.log(moe.id);
  //console.log(nintendo.id);

  const favorites = await Promise.all([
    addFavorite({ user_id: moe.id, product_id: nintendo.id}),
    addFavorite({ user_id: moe.id, product_id: playstation.id}),
    addFavorite({ user_id: ethyl.id, product_id: xbox.id}),
    addFavorite({ user_id: ethyl.id, product_id: gamingComputer.id})
  ]);
  
  //console.log(await fetchFavorites(moe.id));
  
  await deleteFavorites({ user_id: moe.id, id: favorites[0].id});
 
  //console.log(await fetchFavorites(moe.id));
 
  console.log('data seeded');

  const port = process.env.PORT || 3000;
  app.listen(port, ()=> console.log(`listening on port ${port}`));

}
init();
