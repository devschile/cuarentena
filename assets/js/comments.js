document.addEventListener('DOMContentLoaded', () => {
  const CommentForm = {
    template: `
      <form @submit.prevent="submitForm" class="comment-form">
        <input class="comment-form-input" type="text" required v-model="name" placeholder="Nombre">
        <input class="comment-form-input" type="email" required v-model="email" placeholder="Email (no será mostrado)">
        <input class="comment-form-input" type="text" v-model="commune" placeholder="Comuna">
        <textarea class="comment-form-input" required v-model="message" placeholder="Comentario" />
        <p v-if="loading && !success">Enviando... no cierres esta ventana.</p>
        <p v-else-if="!loading && success">Mensaje enviado!</p>
        <p v-else-if="!loading && error">Hubo un problema a enviar el mensaje, <button>inténtalo de nuevo.</button></p>
        <button v-else>Enviar</button>
      </form>
    `,
    props: {
      slug: {
        required: true,
        type: String,
      },
    },
    data() {
      return {
        name: null,
        email: null,
        message: null,
        commune: null,
        loading: false,
        success: false,
        error: false,
      };
    },
    methods: {
      submitForm() {
        this.loading = true;
        this.success = false;
        this.error = false;
        const url = new URL(
          'https://staticman-test.herokuapp.com/v2/entry/devschile/cuarentena/master/comments'
        );
        const queryParams = new URLSearchParams();
        queryParams.append('options[slug]', this.slug);
        queryParams.append('fields[name]', this.name);
        queryParams.append('fields[email]', this.email);
        queryParams.append('fields[commune]', this.commune);
        queryParams.append('fields[message]', this.message);

        axios
          .post(`${url}?${queryParams}`)
          .then(() => {
            this.success = true;
          })
          .catch(() => {
            this.error = true;
          })
          .finally(() => {
            this.loading = false;
          });
      },
    },
  };

  const CommentList = {
    components: {
      CommentForm,
    },
    template: `
      <div>
        <div class="comments-list-backdrop"></div>
        <div class="comments-modal">
          <button class="comments-modal-close" @click="close">✖</button>
          <ul class="comments-list">
            <li v-for="comment in comments" class="comment-list-item">
              <p><strong>{{ comment.name }} - {{ comment.date | date }}</strong></p>
              <p>{{ comment.message }}</p>
            </li>
          </ul>
          <comment-form :slug="slug" />
        </div>
      </div>
    `,
    props: {
      comments: {
        default: () => {},
        type: Object,
      },
      slug: {
        required: true,
        type: String,
      },
    },
    methods: {
      close(e) {
        this.$emit('close');
      },
    },
    filters: {
      date(val) {
        return new Date(val * 1000);
      },
    },
  };

  const CommentCount = Vue.extend({
    components: {
      CommentList,
    },
    template: `
      <div class="comment-link" @click.self="showComments = true">
        {{commentNumber}} comentario{{commentNumber !== 1 ? 's' : ''}}
        <comment-list v-if="showComments" :comments="comments" :slug="slug" @close="showComments = false" />
      </div>`,
    props: {
      slug: {
        required: true,
        type: String,
      },
    },
    data() {
      return {
        showComments: false,
      };
    },
    computed: {
      comments() {
        return window.devCuarentena.comments && window.devCuarentena.comments[this.slug];
      },
      commentNumber() {
        return this.comments ? Object.keys(this.comments).length : 0;
      },
    },
  });

  const mainContent = document.querySelector('.js-parsed-content');

  mainContent.querySelectorAll('a:not(.skip-review)').forEach(a => {
    const url = new URL(a.href);
    const linkComments = new CommentCount({
      propsData: {
        slug: `${url.host}${url.pathname}`.replace(/[^a-z0-9]/gi, '_'),
        number: 4,
      },
    });
    linkComments.$mount();
    a.parentNode.insertBefore(linkComments.$el, a.nextSibling);
  });
});
