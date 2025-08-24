<template>
    <div class="flex h-screen overflow-hidden bg-gray-50">
        <!-- Sidebar -->
        <AppSidebar class="flex-shrink-0" />
        
        <!-- Main Content Area -->
        <div class="flex flex-col flex-1 overflow-hidden">
            <!-- Header -->
            <AppHeader class="flex-shrink-0" />
            
            <!-- Main Content -->
            <main class="flex-1 overflow-auto p-6 bg-white">
                <div class="max-w-full">
                    <NuxtPage />
                </div>
            </main>
        </div>
    </div>
</template>
