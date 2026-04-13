// Ждём полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // ----- Конфигурация -----
    const API_BASE = 'http://localhost:3000/api'; // если сервер на том же домене/порту
    const AVATARS = [
      './i5.png',
      './i3.png',
      './i6.png',
      './i4.png'
    ];
  
    // ----- Элементы DOM -----
    const leftColumn = document.querySelector('.reviews-column:first-child');
    const rightColumn = document.querySelector('.reviews-column:last-child');
    const reviewForm = document.querySelector('.review-form');
    const submitBtn = document.querySelector('.submit-btn');
    const nameInput = document.getElementById('user-name');
    const emailInput = document.getElementById('user-email');
    const commentInput = document.getElementById('user-review');
    const agreeCheckbox = document.getElementById('agree-terms');
  
    // ----- Загрузка 4 случайных комментариев при старте -----
    async function loadRandomComments() {
      try {
        const response = await fetch(`${API_BASE}/comments/random4`);
        if (!response.ok) throw new Error('Ошибка загрузки комментариев');
        const comments = await response.json();
        renderComments(comments);
      } catch (error) {
        console.error('Не удалось загрузить комментарии:', error);
        // Можно показать заглушку или оставить статические карточки
      }
    }
  
    // ----- Отрисовка комментариев по колонкам -----
    function renderComments(comments) {
      // Ожидаем ровно 4 комментария (бэкенд гарантирует, но на всякий случай обрежем/дополним)
      const safeComments = comments.slice(0, 4);
      while (safeComments.length < 4) {
        // если вдруг пришло меньше 4, добавим заглушки (на практике не должно случиться)
        safeComments.push({
          user_name: 'Аноним',
          user_email: '',
          user_comment: 'Комментарий временно отсутствует',
          user_image_path: './i5.png'
        });
      }
  
      // Очищаем колонки
      leftColumn.innerHTML = '';
      rightColumn.innerHTML = '';
  
      // Распределяем комментарии по позициям
      // Левая колонка: первый комментарий — верхний левый угол, второй — нижний левый
      // Правая колонка: первый — верхний правый, второй — нижний правый
      const positions = [
        { column: leftColumn, avatarClass: 'avatar-top-left' },
        { column: leftColumn, avatarClass: 'avatar-bottom-left' },
        { column: rightColumn, avatarClass: 'avatar-top-right' },
        { column: rightColumn, avatarClass: 'avatar-bottom-right' }
      ];
  
      safeComments.forEach((comment, index) => {
        const pos = positions[index];
        const card = createReviewCard(comment, pos.avatarClass);
        pos.column.appendChild(card);
      });
    }
  
    // ----- Создание DOM-элемента карточки комментария -----
    function createReviewCard(comment, avatarClass) {
      const card = document.createElement('div');
      card.className = 'review-card';
  
      // Аватар
      const avatarDiv = document.createElement('div');
      avatarDiv.className = `review-avatar ${avatarClass}`;
      const img = document.createElement('img');
      img.src = comment.user_image_path || './i5.png'; // запасной вариант
      img.alt = comment.user_name;
      img.className = 'avatar-img';
      avatarDiv.appendChild(img);
      card.appendChild(avatarDiv);
  
      // Контент
      const contentDiv = document.createElement('div');
      contentDiv.className = 'review-content';
  
      // Заголовок с именем и звёздами
      const headerDiv = document.createElement('div');
      headerDiv.className = 'review-header';
  
      const nameH3 = document.createElement('h3');
      nameH3.textContent = comment.user_name;
  
      const starsDiv = document.createElement('div');
      starsDiv.className = 'review-stars';
      // Всегда 5 звёзд
      starsDiv.innerHTML = '<span class="star">★</span>'.repeat(5);
  
      headerDiv.appendChild(nameH3);
      headerDiv.appendChild(starsDiv);
  
      // Email
      const emailP = document.createElement('p');
      emailP.className = 'review-email';
      emailP.textContent = comment.user_email || '';
  
      // Текст комментария
      const textContainer = document.createElement('div');
      textContainer.className = 'review-text-container';
      const textP = document.createElement('p');
      textP.className = 'review-text';
      textP.textContent = comment.user_comment;
      textContainer.appendChild(textP);
  
      // Собираем контент
      contentDiv.appendChild(headerDiv);
      contentDiv.appendChild(emailP);
      contentDiv.appendChild(textContainer);
      card.appendChild(contentDiv);
  
      return card;
    }
  
    // ----- Отправка нового комментария -----
    async function submitNewComment(event) {
      event.preventDefault(); // предотвращаем возможную перезагрузку
  
      // Простейшая валидация
      if (!nameInput.value.trim() || !emailInput.value.trim() || !commentInput.value.trim()) {
        alert('Пожалуйста, заполните все поля');
        return;
      }
      if (!agreeCheckbox.checked) {
        alert('Необходимо согласие на обработку персональных данных');
        return;
      }
  
      // Выбираем случайный аватар из списка
      const randomAvatar = AVATARS[Math.floor(Math.random() * AVATARS.length)];
  
      const newComment = {
        user_name: nameInput.value.trim(),
        user_email: emailInput.value.trim(),
        user_comment: commentInput.value.trim(),
        user_image_path: randomAvatar
      };
  
      try {
        const response = await fetch(`${API_BASE}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newComment)
        });
  
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Ошибка при отправке');
        }
  
        // Очищаем форму
        nameInput.value = '';
        emailInput.value = '';
        commentInput.value = '';
        agreeCheckbox.checked = false;
  
        // Обновляем список комментариев (снова 4 случайных)
        await loadRandomComments();
  
        alert('Спасибо, ваш комментарий добавлен!');
      } catch (error) {
        console.error('Ошибка отправки:', error);
        alert('Не удалось отправить комментарий. Попробуйте позже.');
      }
    }
  
    // ----- Навешиваем обработчик на кнопку отправки -----
    submitBtn.addEventListener('click', submitNewComment);
  
    // ----- Инициализация: загружаем комментарии -----
    loadRandomComments();
  });