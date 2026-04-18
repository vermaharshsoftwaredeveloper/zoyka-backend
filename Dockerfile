# Use the official AWS Lambda Node.js 22 image
FROM public.ecr.aws/lambda/nodejs:22

# Install pnpm
RUN npm install -g pnpm

# Copy package files and install ALL dependencies
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Copy Prisma and generate client
COPY prisma ./prisma
RUN pnpm prisma generate

# 1. Copy the internal logic folder
COPY src ./src

# 2. Copy the entry file from your NEW src location to the Docker ROOT
COPY src/lambda.js ./

# 3. Tell AWS to run the file sitting in the root
CMD ["src/lambda.handler"]