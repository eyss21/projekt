from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from ariadne import load_schema_from_path, make_executable_schema
from ariadne.asgi import GraphQL

from app.resolvers import query, mutation

type_defs = load_schema_from_path("app/schema.graphql")
schema = make_executable_schema(type_defs, query, mutation)

app = FastAPI()

# Dodaj middleware CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tu można wpisać adres frontendowy zamiast "*" dla większego bezpieczeństwa
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/graphql", GraphQL(schema, debug=True))

@app.get("/")
def read_root():
    return {"Hello": "World"}
