FROM node:18-alpine

WORKDIR /app

# Копируем package.json и yarn.lock
COPY package.json ./
COPY yarn.lock* ./

# Устанавливаем зависимости
RUN yarn install

# Копируем исходный код
COPY . .

# Открываем порт
EXPOSE 3000

# Запускаем приложение
CMD ["yarn", "start"]
