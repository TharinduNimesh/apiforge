<template>
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <!-- Blob 1 -->
    <div class="absolute -top-[20%] -left-[10%] w-[45%] h-[45%] rounded-full bg-gradient-to-br from-orange-200/30 to-orange-500/30 blur-[80px] animate-blob"></div>
    <!-- Blob 2 -->
    <div class="absolute top-[30%] -right-[15%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-orange-300/20 to-pink-500/20 blur-[90px] animate-blob animation-delay-2000"></div>
    <!-- Blob 3 -->
    <div class="absolute -bottom-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-blue-200/20 to-orange-300/20 blur-[70px] animate-blob animation-delay-4000"></div>
  </div>
</template>

<style scoped>
.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}
</style>