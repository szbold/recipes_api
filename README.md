## Api for a recipe site

#### Features
* View a list and filter it with query params
* CRUD operations on recipes

#### Recipe model
* title
* ingredients
* steps
* tags
* difficulty
* rating
* image (only one for ease of creation)

#### Endpoints

```
/recipes
  |-> /all - gets all recipes (default limit is 25, search params work here)
  |-> /:id - get, put, delete
  |-> /add - create new recipe
```