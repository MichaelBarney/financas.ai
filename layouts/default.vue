<template>
    <div class="w-screen h-screen overflow-x-hidden">
        <AppHeader />
        <div class="flex">
            <AppSidebar />
            <main class="flex-1 ml-64 p-6">
                <NuxtPage />
            </main>
        </div>
    </div>
</template>
