<template>
  <div id="app">
    <ContentExtractor />
  </div>
</template>

<script>
import ContentExtractor from './components/ContentExtractor.vue';

export default {
  name: 'App',
  components: {
    ContentExtractor
  }
};
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  padding: 20px 0;
}
</style>
