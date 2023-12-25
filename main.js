function createElement(tag, className, content = '') {
    const element = document.createElement(tag);
    element.classList.add(className);
    element.innerHTML = content;
    return element;
}

function createAuthorElement(record) {
    const { user = { name: { first: '', last: '' } } } = record;
    const authorElement = createElement('div', 'author-name', `${user.name.first} ${user.name.last}`);
    return authorElement;
}

function createUpvotesElement(record) {
    const upvotesElement = createElement('div', 'upvotes', record.upvotes);
    return upvotesElement;
}

function createFooterElement(record) {
    const footerElement = createElement('div', 'item-footer');
    footerElement.append(createAuthorElement(record), createUpvotesElement(record));
    return footerElement;
}

function createContentElement(record) {
    const contentElement = createElement('div', 'item-content', record.text);
    return contentElement;
}

function createListItemElement(record) {
    const itemElement = createElement('div', 'facts-list-item');
    itemElement.append(createContentElement(record), createFooterElement(record));
    return itemElement;
}

function renderRecords(records) {
    const factsList = document.querySelector('.facts-list');
    factsList.innerHTML = '';
    records.forEach(record => factsList.append(createListItemElement(record)));
}

function setPaginationInfo(info) {
    const totalCountElement = document.querySelector('.total-count');
    totalCountElement.innerHTML = info.total_count;

    const start = info.total_count && (info.current_page - 1) * info.per_page + 1;
    const startElement = document.querySelector('.current-interval-start');
    startElement.innerHTML = start;

    const end = Math.min(info.total_count, start + info.per_page - 1);
    const endElement = document.querySelector('.current-interval-end');
    endElement.innerHTML = end;
}

function createPageBtn(page, classes = []) {
    const btn = createElement('button', 'btn', page);
    btn.dataset.page = page;
    classes.forEach(cls => btn.classList.add(cls));
    return btn;
}

function renderPaginationElement(info) {
    const paginationContainer = document.querySelector('.pagination');
    paginationContainer.innerHTML = '';

    const firstPageBtn = createPageBtn(1, ['first-page-btn']);
    firstPageBtn.innerHTML = 'Первая страница';
    firstPageBtn.style.visibility = info.current_page === 1 ? 'hidden' : 'visible';
    paginationContainer.append(firstPageBtn);

    const buttonsContainer = createElement('div', 'pages-btns');
    paginationContainer.append(buttonsContainer);

    const start = Math.max(info.current_page - 2, 1);
    const end = Math.min(info.current_page + 2, info.total_pages);
    
    for (let i = start; i <= end; i++) {
        const btn = createPageBtn(i, i === info.current_page ? ['active'] : []);
        buttonsContainer.append(btn);
    }

    const lastPageBtn = createPageBtn(info.total_pages, ['last-page-btn']);
    lastPageBtn.innerHTML = 'Последняя страница';
    lastPageBtn.style.visibility = info.current_page === info.total_pages ? 'hidden' : 'visible';
    paginationContainer.append(lastPageBtn);
}

function downloadData(page = 1, query = null) {
    const factsList = document.querySelector('.facts-list');
    const url = new URL(factsList.dataset.url);
    const perPage = document.querySelector('.per-page-btn').value;

    url.searchParams.append('page', page);
    url.searchParams.append('per-page', perPage);

    if (query) {
        url.searchParams.append('q', query);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'json';
    xhr.onload = function () {
        renderRecords(this.response.records);
        setPaginationInfo(this.response['_pagination']);
        renderPaginationElement(this.response['_pagination']);
    };

    xhr.send();
}

function perPageBtnHandler() {
    downloadData(1);
}

function pageBtnHandler(event) {
    if (event.target.dataset.page) {
        downloadData(event.target.dataset.page);
        window.scrollTo(0, 0);
    }
}

function search() {
    const searchField = document.querySelector('.search-field');
    searchField.value = searchField.value.trim();
    
    if (searchField.value === '') {
        return downloadData();
    }

    downloadData(1, searchField.value);
    window.scrollTo(0, 0);
}

function clearAllListItems(event) {
    const list = document.getElementById('autocomplete-list');
    const field = document.querySelector('.search-field');

    if (event && event.target === field) {
        return;
    }

    list.innerHTML = '';
}

function autocomplete(event, arr) {
    const autocompleteList = document.getElementById('autocomplete-list');
    const value = event.target.value.trim();

    clearAllListItems();

    if (value === '') {
        return false;
    }

    for (const phrase of arr) {
        const item = createElement('div', '');
        item.innerHTML = `<strong>${phrase.substr(0, value.length)}</strong>${phrase.substr(value.length)}`;
        item.addEventListener('click', function (e) {
            event.target.value = phrase;
            clearAllListItems(e);
        });
        autocompleteList.append(item);
    }
}

function getAutocompleteItems(event) {
    const query = event.target.value.trim();
    if (query === '') {
        return;
    }

    const url = new URL('http://cat-facts-api.std-900.ist.mospolytech.ru/autocomplete');
    url.searchParams.append('q', query);

    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'json';
    xhr.onload = function () {
        autocomplete(event, this.response);
    };
    xhr.send();
}

window.onload = function () {
    downloadData();

    document.querySelector('.search-field').addEventListener('input', getAutocompleteItems);

    document.addEventListener('click', function (e) {
        clearAllListItems(e);
    });

    document.querySelector('.search-btn').onclick = search;
    document.querySelector('.pagination').onclick = pageBtnHandler;
    document.querySelector('.per-page-btn').onchange = perPageBtnHandler;
};
