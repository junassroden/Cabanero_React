import { useEffect, useMemo, useState } from 'react';
import API_URL from './services/api';
import './index.css';

function getPath() {
    return window.location.pathname;
}

function getProductId() {
    const match = window.location.pathname.match(
        /^\/products\/([^/]+)\/edit$/
    );

    return match ? match[1] : null;
}

function App() {
    const [token, setToken] = useState(
        () => localStorage.getItem('access_token')
    );

    const [path, setPath] = useState(getPath());

    const [products, setProducts] = useState([]);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin123');

    const [search, setSearch] = useState('');

    const [productName, setProductName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');

    const [deleteTarget, setDeleteTarget] = useState(null);

    const productId = getProductId();

    const navigate = (url) => {
        window.history.pushState({}, '', url);
        setPath(url);

        setError('');
        setSuccess('');
    };

    useEffect(() => {
        const handlePopState = () => {
            setPath(getPath());
            setError('');
            setSuccess('');
        };

        window.addEventListener(
            'popstate',
            handlePopState
        );

        return () => {
            window.removeEventListener(
                'popstate',
                handlePopState
            );
        };
    }, []);

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    const showError = (message) => {
        setError(message);
        setSuccess('');
    };

    const showSuccess = (message) => {
        setSuccess(message);
        setError('');
    };

    const logout = () => {
        localStorage.removeItem('access_token');

        setToken(null);
        setProducts([]);

        resetForm();

        window.history.pushState({}, '', '/');
        setPath('/');
    };

    const handleUnauthorized = () => {
        localStorage.removeItem('access_token');

        setToken(null);
        setProducts([]);

        resetForm();

        window.history.pushState({}, '', '/');
        setPath('/');
    };

    const getErrorMessage = async (
        response,
        fallback
    ) => {
        try {
            const data = await response.json();

            return (
                data?.error ||
                data?.message ||
                fallback
            );
        } catch {
            return fallback;
        }
    };

    const login = async (event) => {
        event.preventDefault();

        setLoading(true);
        clearMessages();

        try {
            const response = await fetch(
                `${API_URL}/login`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json'
                    },
                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                        'Login failed.'
                );
            }

            localStorage.setItem(
                'access_token',
                data.access_token
            );

            setToken(data.access_token);

            window.history.pushState(
                {},
                '',
                '/products'
            );

            setPath('/products');
        } catch (error) {
            console.error(
                'Login error:',
                error
            );

            if (
                error instanceof TypeError &&
                error.message === 'Failed to fetch'
            ) {
                showError(
                    'The API request could not be completed. Please check the browser console for the network error.'
                );
            } else {
                showError(
                    error.message ||
                        'Login failed.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        const savedToken =
            localStorage.getItem(
                'access_token'
            );

        if (!savedToken) {
            setToken(null);
            return;
        }

        setLoading(true);
        clearMessages();

        try {
            const response = await fetch(
                `${API_URL}/products`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${savedToken}`
                    }
                }
            );

            if (response.status === 401) {
                handleUnauthorized();

                throw new Error(
                    'Your session has expired. Please sign in again.'
                );
            }

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(
                        response,
                        'Failed to load products.'
                    )
                );
            }

            const data =
                await response.json();

            setProducts(
                Array.isArray(data?.data)
                    ? data.data
                    : []
            );
        } catch (error) {
            console.error(
                'Products error:',
                error
            );

            if (
                error instanceof TypeError &&
                error.message === 'Failed to fetch'
            ) {
                showError(
                    'Unable to reach the product API.'
                );
            } else {
                showError(
                    error.message ||
                        'Failed to load products.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchProducts();
        }
    }, [token]);

    const resetForm = () => {
        setProductName('');
        setDescription('');
        setPrice('');
        setQuantity('');
    };

    const createProduct = async (event) => {
        event.preventDefault();

        const savedToken =
            localStorage.getItem(
                'access_token'
            );

        if (!savedToken) {
            setToken(null);
            return;
        }

        setLoading(true);
        clearMessages();

        try {
            const response = await fetch(
                `${API_URL}/products`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type':
                            'application/json',
                        Authorization: `Bearer ${savedToken}`
                    },
                    body: JSON.stringify({
                        product_name:
                            productName,
                        description,
                        price: Number(price),
                        quantity: Number(
                            quantity
                        )
                    })
                }
            );

            if (response.status === 401) {
                handleUnauthorized();

                throw new Error(
                    'Your session has expired.'
                );
            }

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(
                        response,
                        'Failed to create product.'
                    )
                );
            }

            await response
                .json()
                .catch(() => null);

            await fetchProducts();

            resetForm();

            window.history.pushState(
                {},
                '',
                '/products'
            );

            setPath('/products');

            showSuccess(
                'Product created successfully.'
            );
        } catch (error) {
            console.error(
                'Create product error:',
                error
            );

            if (
                error instanceof TypeError &&
                error.message === 'Failed to fetch'
            ) {
                showError(
                    'Unable to reach the product API.'
                );
            } else {
                showError(
                    error.message ||
                        'Failed to create product.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const updateProduct = async (event) => {
        event.preventDefault();

        const savedToken =
            localStorage.getItem(
                'access_token'
            );

        if (!savedToken) {
            setToken(null);
            return;
        }

        if (!productId) {
            showError(
                'Product ID was not found.'
            );

            return;
        }

        setLoading(true);
        clearMessages();

        try {
            const response = await fetch(
                `${API_URL}/products/${productId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type':
                            'application/json',
                        Authorization: `Bearer ${savedToken}`
                    },
                    body: JSON.stringify({
                        product_name:
                            productName,
                        description,
                        price: Number(price),
                        quantity: Number(
                            quantity
                        )
                    })
                }
            );

            if (response.status === 401) {
                handleUnauthorized();

                throw new Error(
                    'Your session has expired.'
                );
            }

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(
                        response,
                        'Failed to update product.'
                    )
                );
            }

            await response
                .json()
                .catch(() => null);

            await fetchProducts();

            resetForm();

            window.history.pushState(
                {},
                '',
                '/products'
            );

            setPath('/products');

            showSuccess(
                'Product updated successfully.'
            );
        } catch (error) {
            console.error(
                'Update product error:',
                error
            );

            if (
                error instanceof TypeError &&
                error.message === 'Failed to fetch'
            ) {
                showError(
                    'Unable to reach the product API.'
                );
            } else {
                showError(
                    error.message ||
                        'Failed to update product.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const deleteProduct = async () => {
        if (!deleteTarget) {
            return;
        }

        const savedToken =
            localStorage.getItem(
                'access_token'
            );

        if (!savedToken) {
            setToken(null);
            return;
        }

        setLoading(true);
        clearMessages();

        try {
            const response = await fetch(
                `${API_URL}/products/${deleteTarget.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${savedToken}`
                    }
                }
            );

            if (response.status === 401) {
                handleUnauthorized();

                throw new Error(
                    'Your session has expired.'
                );
            }

            if (!response.ok) {
                throw new Error(
                    await getErrorMessage(
                        response,
                        'Failed to delete product.'
                    )
                );
            }

            await response
                .json()
                .catch(() => null);

            setDeleteTarget(null);

            await fetchProducts();

            showSuccess(
                'Product deleted successfully.'
            );
        } catch (error) {
            console.error(
                'Delete product error:',
                error
            );

            if (
                error instanceof TypeError &&
                error.message === 'Failed to fetch'
            ) {
                showError(
                    'Unable to reach the product API.'
                );
            } else {
                showError(
                    error.message ||
                        'Failed to delete product.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!token || !productId) {
            return;
        }

        const product = products.find(
            (item) =>
                String(item.id) ===
                String(productId)
        );

        if (!product) {
            return;
        }

        setProductName(
            product.product_name ?? ''
        );

        setDescription(
            product.description ?? ''
        );

        setPrice(
            product.price ?? ''
        );

        setQuantity(
            product.quantity ?? ''
        );
    }, [productId, products, token]);

    const filteredProducts = useMemo(() => {
        const value =
            search.trim().toLowerCase();

        if (!value) {
            return products;
        }

        return products.filter(
            (product) =>
                String(product.id)
                    .toLowerCase()
                    .includes(value) ||
                String(
                    product.product_name || ''
                )
                    .toLowerCase()
                    .includes(value) ||
                String(
                    product.description || ''
                )
                    .toLowerCase()
                    .includes(value)
        );
    }, [products, search]);

    if (!token) {
        return (
            <Login
                username={username}
                password={password}
                setUsername={setUsername}
                setPassword={setPassword}
                login={login}
                loading={loading}
                error={error}
            />
        );
    }

    const isCreate =
        path === '/products/create';

    const isEdit =
        /^\/products\/[^/]+\/edit$/.test(
            path
        );

    return (
        <div className="app">
            <Navbar
                navigate={navigate}
                logout={logout}
            />

            <main className="main">
                {isCreate && (
                    <ProductForm
                        mode="create"
                        productName={productName}
                        description={description}
                        price={price}
                        quantity={quantity}
                        setProductName={
                            setProductName
                        }
                        setDescription={
                            setDescription
                        }
                        setPrice={setPrice}
                        setQuantity={
                            setQuantity
                        }
                        submit={
                            createProduct
                        }
                        cancel={() => {
                            resetForm();
                            navigate(
                                '/products'
                            );
                        }}
                        loading={loading}
                        error={error}
                        success={success}
                    />
                )}

                {isEdit && (
                    <ProductForm
                        mode="edit"
                        productName={productName}
                        description={description}
                        price={price}
                        quantity={quantity}
                        setProductName={
                            setProductName
                        }
                        setDescription={
                            setDescription
                        }
                        setPrice={setPrice}
                        setQuantity={
                            setQuantity
                        }
                        submit={
                            updateProduct
                        }
                        cancel={() => {
                            resetForm();
                            navigate(
                                '/products'
                            );
                        }}
                        loading={loading}
                        error={error}
                        success={success}
                    />
                )}

                {!isCreate &&
                    !isEdit && (
                        <Products
                            products={
                                filteredProducts
                            }
                            total={
                                products.length
                            }
                            search={search}
                            setSearch={
                                setSearch
                            }
                            loading={
                                loading
                            }
                            error={error}
                            success={
                                success
                            }
                            refresh={
                                fetchProducts
                            }
                            add={() =>
                                navigate(
                                    '/products/create'
                                )
                            }
                            edit={(product) => {
                                setProductName(
                                    product.product_name ??
                                        ''
                                );

                                setDescription(
                                    product.description ??
                                        ''
                                );

                                setPrice(
                                    product.price ??
                                        ''
                                );

                                setQuantity(
                                    product.quantity ??
                                        ''
                                );

                                navigate(
                                    `/products/${product.id}/edit`
                                );
                            }}
                            remove={
                                setDeleteTarget
                            }
                        />
                    )}
            </main>

            {deleteTarget && (
                <DeleteDialog
                    product={deleteTarget}
                    loading={loading}
                    cancel={() =>
                        setDeleteTarget(
                            null
                        )
                    }
                    confirm={deleteProduct}
                />
            )}
        </div>
    );
}

function Navbar({ navigate, logout }) {
    return (
        <header className="navbar">
            <div className="navbar-inner">
                <button
                    className="brand"
                    onClick={() =>
                        navigate('/products')
                    }
                >
                    <span className="brand-mark">
                        P
                    </span>

                    <span className="brand-copy">
                        <strong>
                            Product Management
                        </strong>

                        <small>
                            Inventory workspace
                        </small>
                    </span>
                </button>

                <nav>
                    <button
                        className="nav-link active"
                        onClick={() =>
                            navigate('/products')
                        }
                    >
                        Products
                    </button>
                </nav>

                <div className="account">
                    <span>
                        Administrator
                    </span>

                    <button
                        onClick={logout}
                    >
                        Sign out
                    </button>
                </div>
            </div>
        </header>
    );
}

function Login({
    username,
    password,
    setUsername,
    setPassword,
    login,
    loading,
    error
}) {
    return (
        <div className="login-page">
            <div className="login-wrapper">
                <div className="login-brand">
                    <span className="brand-mark large">
                        P
                    </span>

                    <div>
                        <strong>
                            Product Management
                        </strong>

                        <small>
                            Inventory workspace
                        </small>
                    </div>
                </div>

                <section className="login-card">
                    <div className="eyebrow">
                        ACCOUNT ACCESS
                    </div>

                    <h1>
                        Sign in
                    </h1>

                    <p className="muted">
                        Enter your credentials to
                        access the product workspace.
                    </p>

                    {error && (
                        <Alert
                            type="error"
                            message={error}
                        />
                    )}

                    <form
                        onSubmit={login}
                        className="login-form"
                    >
                        <Field
                            label="Username"
                            htmlFor="username"
                        >
                            <input
                                id="username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(
                                        e.target
                                            .value
                                    )
                                }
                                autoComplete="username"
                                required
                            />
                        </Field>

                        <Field
                            label="Password"
                            htmlFor="password"
                        >
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target
                                            .value
                                    )
                                }
                                autoComplete="current-password"
                                required
                            />
                        </Field>

                        <button
                            className="button primary full"
                            disabled={loading}
                        >
                            {loading
                                ? 'Signing in...'
                                : 'Sign in'}
                        </button>
                    </form>
                </section>

                <div className="login-footer">
                    <span>
                        Product Management System
                    </span>

                    <span>
                        Secure access
                    </span>
                </div>
            </div>
        </div>
    );
}

function Products({
    products,
    total,
    search,
    setSearch,
    loading,
    error,
    success,
    refresh,
    add,
    edit,
    remove
}) {
    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <div className="eyebrow">
                        PRODUCTS
                    </div>

                    <h1>
                        Product inventory
                    </h1>

                    <p>
                        Manage your product catalog
                        and inventory information.
                    </p>
                </div>

                <div className="header-actions">
                    <button
                        className="button secondary"
                        onClick={refresh}
                        disabled={loading}
                    >
                        {loading
                            ? 'Refreshing...'
                            : 'Refresh'}
                    </button>

                    <button
                        className="button primary"
                        onClick={add}
                    >
                        Add product
                    </button>
                </div>
            </div>

            {success && (
                <Alert
                    type="success"
                    message={success}
                />
            )}

            {error && (
                <Alert
                    type="error"
                    message={error}
                />
            )}

            <section className="table-panel">
                <div className="table-toolbar">
                    <div>
                        <strong>
                            All products
                        </strong>

                        <span>
                            {total}{' '}
                            {total === 1
                                ? 'record'
                                : 'records'}
                        </span>
                    </div>

                    <input
                        className="search"
                        type="search"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />
                </div>

                {loading &&
                products.length === 0 ? (
                    <div className="state">
                        <div className="spinner" />

                        <strong>
                            Loading products
                        </strong>

                        <p>
                            Retrieving the latest
                            inventory data.
                        </p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="state">
                        <div className="empty-mark">
                            P
                        </div>

                        <strong>
                            {search
                                ? 'No matching products'
                                : 'No products yet'}
                        </strong>

                        <p>
                            {search
                                ? 'Try a different search term.'
                                : 'Add your first product to begin managing inventory.'}
                        </p>

                        {!search && (
                            <button
                                className="button primary"
                                onClick={add}
                            >
                                Add product
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>
                                        Product
                                    </th>
                                    <th>
                                        Description
                                    </th>
                                    <th>
                                        Price
                                    </th>
                                    <th>
                                        Quantity
                                    </th>
                                    <th>
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {products.map(
                                    (product) => (
                                        <tr
                                            key={
                                                product.id
                                            }
                                        >
                                            <td className="id">
                                                #
                                                {
                                                    product.id
                                                }
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        product.product_name
                                                    }
                                                </strong>
                                            </td>

                                            <td className="description">
                                                {product.description ||
                                                    'No description'}
                                            </td>

                                            <td className="price">
                                                ₱
                                                {Number(
                                                    product.price
                                                ).toFixed(
                                                    2
                                                )}
                                            </td>

                                            <td>
                                                {
                                                    product.quantity
                                                }
                                            </td>

                                            <td>
                                                <div className="row-actions">
                                                    <button
                                                        className="text-button"
                                                        onClick={() =>
                                                            edit(
                                                                product
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        className="text-button danger"
                                                        onClick={() =>
                                                            remove(
                                                                product
                                                            )
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="table-footer">
                    <span>
                        {search
                            ? `Showing ${products.length} matching ${
                                  products.length ===
                                  1
                                      ? 'record'
                                      : 'records'
                              }`
                            : `Showing ${products.length} ${
                                  products.length ===
                                  1
                                      ? 'product'
                                      : 'products'
                              }`}
                    </span>

                    <span>
                        API connected
                    </span>
                </div>
            </section>
        </div>
    );
}

function ProductForm({
    mode,
    productName,
    description,
    price,
    quantity,
    setProductName,
    setDescription,
    setPrice,
    setQuantity,
    submit,
    cancel,
    loading,
    error,
    success
}) {
    const editMode = mode === 'edit';

    return (
        <div className="page">
            <div className="form-heading">
                <div className="breadcrumb">
                    <button
                        onClick={cancel}
                    >
                        Products
                    </button>

                    <span>/</span>

                    <strong>
                        {editMode
                            ? 'Edit product'
                            : 'New product'}
                    </strong>
                </div>

                <div className="eyebrow">
                    {editMode
                        ? 'PRODUCT EDITOR'
                        : 'NEW PRODUCT'}
                </div>

                <h1>
                    {editMode
                        ? 'Edit product'
                        : 'Create product'}
                </h1>

                <p>
                    {editMode
                        ? 'Update the product information below and save your changes.'
                        : 'Add a new product to your inventory.'}
                </p>
            </div>

            {success && (
                <Alert
                    type="success"
                    message={success}
                />
            )}

            {error && (
                <Alert
                    type="error"
                    message={error}
                />
            )}

            <form
                className="product-form"
                onSubmit={submit}
            >
                <section className="form-section">
                    <div className="section-heading">
                        <span>
                            01
                        </span>

                        <div>
                            <h2>
                                Product information
                            </h2>

                            <p>
                                Basic information used
                                to identify the product.
                            </p>
                        </div>
                    </div>

                    <div className="fields">
                        <Field
                            label="Product name"
                            htmlFor="product-name"
                        >
                            <input
                                id="product-name"
                                value={productName}
                                onChange={(e) =>
                                    setProductName(
                                        e.target
                                            .value
                                    )
                                }
                                placeholder="Enter product name"
                                required
                            />
                        </Field>

                        <Field
                            label="Description"
                            htmlFor="description"
                            optional
                        >
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) =>
                                    setDescription(
                                        e.target
                                            .value
                                    )
                                }
                                placeholder="Enter a short product description"
                                rows="5"
                            />
                        </Field>
                    </div>
                </section>

                <section className="form-section">
                    <div className="section-heading">
                        <span>
                            02
                        </span>

                        <div>
                            <h2>
                                Pricing & inventory
                            </h2>

                            <p>
                                Set the price and
                                available quantity.
                            </p>
                        </div>
                    </div>

                    <div className="fields two-column">
                        <Field
                            label="Price"
                            htmlFor="price"
                        >
                            <div className="price-input">
                                <span>
                                    ₱
                                </span>

                                <input
                                    id="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) =>
                                        setPrice(
                                            e.target
                                                .value
                                        )
                                    }
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </Field>

                        <Field
                            label="Quantity"
                            htmlFor="quantity"
                        >
                            <input
                                id="quantity"
                                type="number"
                                min="0"
                                value={quantity}
                                onChange={(e) =>
                                    setQuantity(
                                        e.target
                                            .value
                                    )
                                }
                                placeholder="0"
                                required
                            />
                        </Field>
                    </div>
                </section>

                <div className="form-actions">
                    <button
                        type="button"
                        className="button secondary"
                        onClick={cancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="button primary"
                        disabled={loading}
                    >
                        {loading
                            ? editMode
                                ? 'Saving changes...'
                                : 'Creating product...'
                            : editMode
                            ? 'Save changes'
                            : 'Create product'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({
    label,
    htmlFor,
    children,
    optional
}) {
    return (
        <div className="field">
            <label htmlFor={htmlFor}>
                <span>
                    {label}
                </span>

                {optional && (
                    <small>
                        Optional
                    </small>
                )}
            </label>

            {children}
        </div>
    );
}

function Alert({ type, message }) {
    return (
        <div
            className={`alert ${
                type === 'error'
                    ? 'error'
                    : 'success'
            }`}
        >
            <span className="alert-icon">
                {type === 'error'
                    ? '!'
                    : '✓'}
            </span>

            <span>
                {message}
            </span>
        </div>
    );
}

function DeleteDialog({
    product,
    loading,
    cancel,
    confirm
}) {
    return (
        <div
            className="modal-backdrop"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    cancel();
                }
            }}
        >
            <div className="delete-dialog">
                <div className="eyebrow">
                    DELETE PRODUCT
                </div>

                <h2>
                    Delete product?
                </h2>

                <p>
                    You are about to remove{' '}
                    <strong>
                        {product.product_name}
                    </strong>{' '}
                    from the inventory.
                </p>

                <div className="dialog-actions">
                    <button
                        className="button secondary"
                        onClick={cancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        className="button danger-button"
                        onClick={confirm}
                        disabled={loading}
                    >
                        {loading
                            ? 'Deleting...'
                            : 'Delete product'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default App;