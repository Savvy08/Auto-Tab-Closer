const MAX_TABS = 15;        // Максимальное количество вкладок до срабатывания немедленного закрытия
const KEEP_TABS = 3;        // Количество обычных вкладок, которые нужно оставить
const INTERVAL_MINUTES = 10; // Интервал времени в минутах для автоматического закрытия

// Создаём таймер при установке расширения
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("autoCloseTabs", { periodInMinutes: INTERVAL_MINUTES });
});

// Обработчик таймера — срабатывает каждые 10 минут
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "autoCloseTabs") {
    closeExtraTabs();
  }
});

// Следим за созданием новых вкладок — если их слишком много, закрываем лишние
chrome.tabs.onCreated.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    if (tabs.length > MAX_TABS) {
      closeExtraTabs();
    }
  });
});

// Основная функция закрытия лишних вкладок
function closeExtraTabs() {
  chrome.tabs.query({ currentWindow: true }, (tabs) => {
    // Отделяем закреплённые вкладки — они не подлежат закрытию
    const pinnedTabs = tabs.filter(tab => tab.pinned);
    const normalTabs = tabs.filter(tab => !tab.pinned);

    // Если обычных вкладок меньше или равно KEEP_TABS — ничего не делаем
    if (normalTabs.length <= KEEP_TABS) return;

    // Сортируем обычные вкладки по времени последнего доступа (от новых к старым)
    normalTabs.sort((a, b) => b.lastAccessed - a.lastAccessed);

    // Оставляем только KEEP_TABS самых свежих обычных вкладок
    const tabsToClose = normalTabs.slice(KEEP_TABS);

    // Закрываем лишние вкладки
    tabsToClose.forEach(tab => {
      chrome.tabs.remove(tab.id);
    });
  });
}
