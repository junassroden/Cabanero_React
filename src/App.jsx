import { useEffect, useMemo, useState } from 'react';
import API_URL from './services/api';
import './index.css';

const getCurrentPath = () => window.location.pathname;

const getProductIdFromPath = () => {
    const match = window.location.pathname.match(
        /^\/products\/([^/]+)\/edit$/
    );

    return match ? match[1] : null;
};

function App() {
    const [token, setToken] = useState(
        () => localStorage.getItem('access_token')
    );

    const [path, setPath] = useState(getCurrentPath);

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

    const [deleteProduct, setDeleteProduct] = useState(null);

    const productId = getProductIdFromPath();

    const navigate = (nextPath) => {
        window.history.pushState({}, '', nextPath);
        setPath(nextPath);

        setError('');
        setSuccess('');
    };

    useEffect(() => {
        const handlePopState = () => {
            setPath(getCurrentPath());
            setError('');
            setSuccess('');
        };

        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener(
                'popstate',
                handlePopState
            );
        };
    }, []);

    const showError = (message) => {
        setError(message);
        setSuccess('');
    };

    const showSuccess = (message) => {
        setSuccess(message);
        setError('');
    };

    const clearMessages = () => {
        setError('');
        setSuccess('');
    };

    const handleSessionExpired = () => {
        localStorage.removeItem('access_token');
        setToken(null);
        setProducts([]);
        navigate('/');
    };

    const login = async (event) => {
        event.preventDefault();

        setLoading(true);
        clearMessages();

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error || 'Login failed.'
                );
            }

            localStorage.setItem(
                'access_token',
                data.access_token
            );

            setToken(data.access_token);
            navigate('/products');
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getProducts = async () => {
        const savedToken =
            localStorage.getItem('access_token');

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

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    handleSessionExpired();

                    throw new Error(
                        'Your session has expired. Please sign in again.'
                    );
                }

                throw new Error(
                    data.error ||
                    'Failed to load products.'
                );
            }

            setProducts(data.data || []);
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            getProducts();
        }
    }, [token]);

    const resetProductForm = () => {
        setProductName('');
        setDescription('');
        setPrice('');
        setQuantity('');
    };

    const loadProduct = (product) => {
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
    };

    useEffect(() => {
        if (!token) {
            return;
        }

        if (!productId) {
            return;
        }

        const existingProduct = products.find(
            (product) =>
                String(product.id) === String(productId)
        );

        if (existingProduct) {
            loadProduct(existingProduct);
        }
    }, [productId, products, token]);

    const createProduct = async (event) => {
        event.preventDefault();

        const savedToken =
            localStorage.getItem('access_token');

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
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${savedToken}`
                    },
                    body: JSON.stringify({
                        product_name: productName,
                        description: description,
                        price: Number(price),
                        quantity: Number(quantity)
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    handleSessionExpired();

                    throw new Error(
                        'Your session has expired. Please sign in again.'
                    );
                }

                throw new Error(
                    data.error ||
                    'Failed to create product.'
                );
            }

            await getProducts();

            resetProductForm();

            navigate('/products');

            showSuccess(
                'Product created successfully.'
            );
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateProduct = async (event) => {
        event.preventDefault();

        const savedToken =
            localStorage.getItem('access_token');

        if (!savedToken) {
            setToken(null);
            return;
        }

        if (!productId) {
            showError(
                'The product could not be identified.'
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
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${savedToken}`
                    },
                    body: JSON.stringify({
                        product_name: productName,
                        description: description,
                        price: Number(price),
                        quantity: Number(quantity)
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    handleSessionExpired();

                    throw new Error(
                        'Your session has expired. Please sign in again.'
                    );
                }

                throw new Error(
                    data.error ||
                    'Failed to update product.'
                );
            }

            await getProducts();

            resetProductForm();

            navigate('/products');

            showSuccess(
                'Product updated successfully.'
            );
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const removeProduct = async () => {
        if (!deleteProduct) {
            return;
        }

        const savedToken =
            localStorage.getItem('access_token');

        if (!savedToken) {
            setToken(null);
            return;
        }

        setLoading(true);
        clearMessages();

        try {
            const response = await fetch(
                `${API_URL}/products/${deleteProduct.id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${savedToken}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    handleSessionExpired();

                    throw new Error(
                        'Your session has expired. Please sign in again.'
                    );
                }

                throw new Error(
                    data.error ||
                    'Failed to delete product.'
                );
            }

            setDeleteProduct(null);

            await getProducts();

            showSuccess(
                'Product deleted successfully.'
            );
        } catch (err) {
            showError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');

        setToken(null);
        setProducts([]);

        resetProductForm();

        clearMessages();

        navigate('/');
    };

    const filteredProducts = useMemo(() => {
        const term = search
            .trim()
            .toLowerCase();

        if (!term) {
            return products;
        }

        return products.filter((product) => {
            return (
                String(product.id)
                    .toLowerCase()
                    .includes(term) ||
                String(product.product_name || '')
                    .toLowerCase()
                    .includes(term) ||
                String(product.description || '')
                    .toLowerCase()
                    .includes(term)
            );
        });
    }, [products, search]);

    if (!token) {
        return (
            <LoginPage
                username={username}
                password={password}
                setUsername={setUsername}
                setPassword={setPassword}
                onSubmit={login}
                loading={loading}
                error={error}
            />
        );
    }

    const isCreatePage =
        path === '/products/create';

    const isEditPage =
        /^\/products\/[^/]+\/edit$/.test(path);

    return (
        <AppShell
            navigate={navigate}
            logout={logout}
        >
            {isCreatePage && (
                <ProductFormPage
                    mode="create"
                    productName={productName}
                    description={description}
                    price={price}
                    quantity={quantity}
                    setProductName={setProductName}
                    setDescription={setDescription}
                    setPrice={setPrice}
                    setQuantity={setQuantity}
                    onSubmit={createProduct}
                    loading={loading}
                    error={error}
                    success={success}
                    onCancel={() => {
                        resetProductForm();
                        navigate('/products');
                    }}
                />
            )}

            {isEditPage && (
                <ProductFormPage
                    mode="edit"
                    productName={productName}
                    description={description}
                    price={price}
                    quantity={quantity}
                    setProductName={setProductName}
                    setDescription={setDescription}
                    setPrice={setPrice}
                    setQuantity={setQuantity}
                    onSubmit={updateProduct}
                    loading={loading}
                    error={error}
                    success={success}
                    onCancel={() => {
                        resetProductForm();
                        navigate('/products');
                    }}
                />
            )}

            {!isCreatePage &&
                !isEditPage && (
                    <ProductsPage
                        products={filteredProducts}
                        totalProducts={products.length}
                        search={search}
                        setSearch={setSearch}
                        loading={loading}
                        error={error}
                        success={success}
                        onRefresh={getProducts}
                        onAdd={() =>
                            navigate(
                                '/products/create'
                            )
                        }
                        onEdit={(product) => {
                            loadProduct(product);

                            navigate(
                                `/products/${product.id}/edit`
                            );
                        }}
                        onDelete={setDeleteProduct}
                    />
                )}

            {deleteProduct && (
                <DeleteDialog
                    product={deleteProduct}
                    loading={loading}
                    onCancel={() =>
                        setDeleteProduct(null)
                    }
                    onConfirm={removeProduct}
                />
            )}
        </AppShell>
    );
}

function AppShell({
    children,
    navigate,
    logout
}) {
    return (
        <div className="app-shell">
            <header className="topbar">
                <div className="topbar-inner">
                    <button
                        className="brand"
                        onClick={() =>
                            navigate('/products')
                        }
                    >
                        <span className="brand-symbol">
                            P
                        </span>

                        <span className="brand-text">
                            <strong>
                                Product Management
                            </strong>

                            <small>
                                Inventory workspace
                            </small>
                        </span>
                    </button>

                    <nav className="navigation">
                        <button
                            className="navigation-link active"
                            onClick={() =>
                                navigate('/products')
                            }
                        >
                            Products
                        </button>
                    </nav>

                    <div className="account-area">
                        <span className="account-name">
                            Administrator
                        </span>

                        <button
                            className="logout-link"
                            onClick={logout}
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <main className="content">
                {children}
            </main>
        </div>
    );
}

function LoginPage({
    username,
    password,
    setUsername,
    setPassword,
    onSubmit,
    loading,
    error
}) {
    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="brand-symbol large">
                        P
                    </div>

                    <div>
                        <strong>
                            Product Management
                        </strong>

                        <span>
                            Inventory workspace
                        </span>
                    </div>
                </div>

                <section className="login-panel">
                    <div className="eyebrow">
                        ACCOUNT ACCESS
                    </div>

                    <h1>
                        Sign in
                    </h1>

                    <p className="login-intro">
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
                        className="login-form"
                        onSubmit={onSubmit}
                    >
                        <FormField
                            label="Username"
                            htmlFor="username"
                        >
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(event) =>
                                    setUsername(
                                        event.target.value
                                    )
                                }
                                autoComplete="username"
                                required
                            />
                        </FormField>

                        <FormField
                            label="Password"
                            htmlFor="password"
                        >
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value
                                    )
                                }
                                autoComplete="current-password"
                                required
                            />
                        </FormField>

                        <button
                            className="primary-button login-button"
                            type="submit"
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

function ProductsPage({
    products,
    totalProducts,
    search,
    setSearch,
    loading,
    error,
    success,
    onRefresh,
    onAdd,
    onEdit,
    onDelete
}) {
    return (
        <div className="page">
            <PageHeader
                eyebrow="PRODUCTS"
                title="Product inventory"
                description="Manage your product catalog and keep inventory information accurate."
            >
                <button
                    className="secondary-button"
                    onClick={onRefresh}
                    disabled={loading}
                >
                    {loading
                        ? 'Refreshing...'
                        : 'Refresh'}
                </button>

                <button
                    className="primary-button"
                    onClick={onAdd}
                >
                    Add product
                </button>
            </PageHeader>

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

            <section className="data-panel">
                <div className="data-toolbar">
                    <div className="toolbar-title">
                        <strong>
                            All products
                        </strong>

                        <span>
                            {totalProducts}{' '}
                            {totalProducts === 1
                                ? 'record'
                                : 'records'}
                        </span>
                    </div>

                    <label className="search-field">
                        <span>
                            Search
                        </span>

                        <input
                            type="search"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Product name, description or ID"
                        />
                    </label>
                </div>

                {loading &&
                products.length === 0 ? (
                    <LoadingState />
                ) : products.length === 0 ? (
                    <EmptyState
                        hasSearch={Boolean(
                            search.trim()
                        )}
                        onAdd={onAdd}
                    />
                ) : (
                    <ProductTable
                        products={products}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                )}

                <div className="data-footer">
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
                        Connected to API
                    </span>
                </div>
            </section>
        </div>
    );
}

function ProductTable({
    products,
    onEdit,
    onDelete
}) {
    return (
        <div className="table-container">
            <table className="product-table">
                <thead>
                    <tr>
                        <th className="id-column">
                            ID
                        </th>

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

                        <th className="actions-column">
                            Actions
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td className="id-cell">
                                #{product.id}
                            </td>

                            <td>
                                <div className="product-title">
                                    {
                                        product.product_name
                                    }
                                </div>
                            </td>

                            <td>
                                <div className="description-cell">
                                    {product.description ||
                                        'No description'}
                                </div>
                            </td>

                            <td>
                                <span className="price-cell">
                                    ₱
                                    {Number(
                                        product.price
                                    ).toFixed(2)}
                                </span>
                            </td>

                            <td>
                                <span className="quantity-cell">
                                    {
                                        product.quantity
                                    }
                                </span>
                            </td>

                            <td>
                                <div className="row-actions">
                                    <button
                                        className="edit-action"
                                        onClick={() =>
                                            onEdit(
                                                product
                                            )
                                        }
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="delete-action"
                                        onClick={() =>
                                            onDelete(
                                                product
                                            )
                                        }
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function ProductFormPage({
    mode,
    productName,
    description,
    price,
    quantity,
    setProductName,
    setDescription,
    setPrice,
    setQuantity,
    onSubmit,
    loading,
    error,
    success,
    onCancel
}) {
    const isEdit = mode === 'edit';

    return (
        <div className="page form-page">
            <div className="form-header">
                <div>
                    <div className="breadcrumb">
                        <button
                            onClick={onCancel}
                        >
                            Products
                        </button>

                        <span>/</span>

                        <strong>
                            {isEdit
                                ? 'Edit product'
                                : 'New product'}
                        </strong>
                    </div>

                    <div className="eyebrow">
                        {isEdit
                            ? 'PRODUCT EDITOR'
                            : 'NEW PRODUCT'}
                    </div>

                    <h1>
                        {isEdit
                            ? 'Edit product'
                            : 'Create product'}
                    </h1>

                    <p>
                        {isEdit
                            ? 'Update the information for this product and save your changes.'
                            : 'Add a new product to your inventory with the information below.'}
                    </p>
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

            <form
                className="product-form"
                onSubmit={onSubmit}
            >
                <section className="form-section">
                    <div className="form-section-title">
                        <span className="section-index">
                            01
                        </span>

                        <div>
                            <h2>
                                Product information
                            </h2>

                            <p>
                                Basic information used to
                                identify the product.
                            </p>
                        </div>
                    </div>

                    <div className="form-fields">
                        <FormField
                            label="Product name"
                            htmlFor="product-name"
                        >
                            <input
                                id="product-name"
                                type="text"
                                value={productName}
                                onChange={(event) =>
                                    setProductName(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter product name"
                                required
                            />
                        </FormField>

                        <FormField
                            label="Description"
                            htmlFor="product-description"
                            optional
                        >
                            <textarea
                                id="product-description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter a short product description"
                                rows="5"
                            />
                        </FormField>
                    </div>
                </section>

                <section className="form-section">
                    <div className="form-section-title">
                        <span className="section-index">
                            02
                        </span>

                        <div>
                            <h2>
                                Pricing & inventory
                            </h2>

                            <p>
                                Set the current price and
                                available stock quantity.
                            </p>
                        </div>
                    </div>

                    <div className="form-fields form-grid">
                        <FormField
                            label="Price"
                            htmlFor="product-price"
                        >
                            <div className="currency-input">
                                <span>
                                    ₱
                                </span>

                                <input
                                    id="product-price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={price}
                                    onChange={(event) =>
                                        setPrice(
                                            event.target
                                                .value
                                        )
                                    }
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </FormField>

                        <FormField
                            label="Quantity"
                            htmlFor="product-quantity"
                        >
                            <input
                                id="product-quantity"
                                type="number"
                                min="0"
                                value={quantity}
                                onChange={(event) =>
                                    setQuantity(
                                        event.target.value
                                    )
                                }
                                placeholder="0"
                                required
                            />
                        </FormField>
                    </div>
                </section>

                <div className="form-actions">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={loading}
                    >
                        {loading
                            ? isEdit
                                ? 'Saving changes...'
                                : 'Creating product...'
                            : isEdit
                            ? 'Save changes'
                            : 'Create product'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function FormField({
    label,
    htmlFor,
    children,
    optional = false
}) {
    return (
        <div className="form-field">
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

function PageHeader({
    eyebrow,
    title,
    description,
    children
}) {
    return (
        <div className="page-header">
            <div>
                <div className="eyebrow">
                    {eyebrow}
                </div>

                <h1>
                    {title}
                </h1>

                <p>
                    {description}
                </p>
            </div>

            <div className="page-header-actions">
                {children}
            </div>
        </div>
    );
}

function Alert({
    type,
    message
}) {
    return (
        <div
            className={`alert ${
                type === 'error'
                    ? 'alert-error'
                    : 'alert-success'
            }`}
            role="alert"
        >
            <span className="alert-mark">
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

function LoadingState() {
    return (
        <div className="state">
            <div className="loading-line" />

            <strong>
                Loading products
            </strong>

            <p>
                Retrieving the latest inventory
                information.
            </p>
        </div>
    );
}

function EmptyState({
    hasSearch,
    onAdd
}) {
    return (
        <div className="state">
            <div className="empty-symbol">
                P
            </div>

            <strong>
                {hasSearch
                    ? 'No matching products'
                    : 'No products yet'}
            </strong>

            <p>
                {hasSearch
                    ? 'Try adjusting your search.'
                    : 'Add your first product to begin managing your inventory.'}
            </p>

            {!hasSearch && (
                <button
                    className="primary-button"
                    onClick={onAdd}
                >
                    Add product
                </button>
            )}
        </div>
    );
}

function DeleteDialog({
    product,
    loading,
    onCancel,
    onConfirm
}) {
    return (
        <div
            className="dialog-overlay"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onCancel();
                }
            }}
        >
            <div
                className="dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-title"
            >
                <div className="dialog-eyebrow">
                    DELETE PRODUCT
                </div>

                <h2 id="delete-title">
                    Delete product?
                </h2>

                <p>
                    This will permanently remove{' '}
                    <strong>
                        {product.product_name}
                    </strong>{' '}
                    from the product inventory.
                </p>

                <div className="dialog-actions">
                    <button
                        className="secondary-button"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <button
                        className="danger-button"
                        onClick={onConfirm}
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