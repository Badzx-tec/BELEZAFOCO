import fp from "fastify-plugin";

class AppHttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "AppHttpError";
    this.statusCode = statusCode;
  }
}

type HttpErrorFactory = {
  badRequest: (message?: string) => AppHttpError;
  unauthorized: (message?: string) => AppHttpError;
  forbidden: (message?: string) => AppHttpError;
  notFound: (message?: string) => AppHttpError;
  conflict: (message?: string) => AppHttpError;
  paymentRequired: (message?: string) => AppHttpError;
  internalServerError: (message?: string) => AppHttpError;
};

function createBuilder(statusCode: number, fallbackMessage: string) {
  return (message?: string) => new AppHttpError(statusCode, message ?? fallbackMessage);
}

export default fp(async (app) => {
  const httpErrors: HttpErrorFactory = {
    badRequest: createBuilder(400, "Requisicao invalida"),
    unauthorized: createBuilder(401, "Nao autenticado"),
    forbidden: createBuilder(403, "Acesso negado"),
    notFound: createBuilder(404, "Recurso nao encontrado"),
    conflict: createBuilder(409, "Conflito de estado"),
    paymentRequired: createBuilder(402, "Pagamento necessario"),
    internalServerError: createBuilder(500, "Erro interno do servidor")
  };

  app.decorate("httpErrors", httpErrors);
});

declare module "fastify" {
  interface FastifyInstance {
    httpErrors: HttpErrorFactory;
  }
}
