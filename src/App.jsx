import { useEffect, useState } from 'react';
import API_URL from './services/api';
import './index.css';

function App() {
    const [token, setToken] = useState(
        localStorage.getItem('access_token')
    );

    const [products, setProducts] = useState([]);

    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('admin123');

    const [productName, setProductName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');

    const [editingId, setEditingId] = useState(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const login = async (event) => {
        event.preventDefault();

        setLoading(true);
        setError('');
        setMessage('');

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
        } catch (error) {
            setError(error.message);
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
        setError('');

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
                    localStorage.removeItem(
                        'access_token'
                    );

                    setToken(null);

                    throw new Error(
                        'Your session has expired. Please login again.'
                    );
                }

                throw new Error(
                    data.error ||
                    'Failed to load products.'
                );
            }

            setProducts(data.data || []);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setProductName('');
        setDescription('');
        setPrice('');
        setQuantity('');
        setEditingId(null);
    };

    const saveProduct = async (event) => {
        event.preventDefault();

        const savedToken =
            localStorage.getItem('access_token');

        if (!savedToken) {
            setToken(null);
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        const productData = {
            product_name: productName,
            description: description,
            price: Number(price),
            quantity: Number(quantity)
        };

        try {
            const url = editingId
                ? `${API_URL}/products/${editingId}`
                : `${API_URL}/products`;

            const method = editingId
                ? 'PUT'
                : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${savedToken}`
                },
                body: JSON.stringify(productData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    'Failed to save product.'
                );
            }

            setMessage(
                editingId
                    ? 'Product updated successfully.'
                    : 'Product added successfully.'
            );

            resetForm();

            await getProducts();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const editProduct = (product) => {
        setEditingId(product.id);
        setProductName(product.product_name);
        setDescription(product.description || '');
        setPrice(product.price);
        setQuantity(product.quantity);

        setError('');
        setMessage('');

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const deleteProduct = async (id) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this product?'
        );

        if (!confirmed) {
            return;
        }

        const savedToken =
            localStorage.getItem('access_token');

        if (!savedToken) {
            setToken(null);
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch(
                `${API_URL}/products/${id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${savedToken}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.error ||
                    'Failed to delete product.'
                );
            }

            setMessage(
                'Product deleted successfully.'
            );

            if (editingId === id) {
                resetForm();
            }

            await getProducts();
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');

        setToken(null);
        setProducts([]);

        resetForm();

        setError('');
        setMessage('');
    };

    useEffect(() => {
        if (token) {
            getProducts();
        }
    }, [token]);

    if (!token) {
        return (
            <div className="login-page">
                <div className="login-card">

                    <div className="brand-section">
                        <div className="brand-icon">
                            P
                        </div>

                        <div>
                            <h1>
                                Product Management
                            </h1>

                            <p>
                                Sign in to continue
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={login}>

                        <div className="form-group">
                            <label htmlFor="username">
                                Username
                            </label>

                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(event) =>
                                    setUsername(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter username"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">
                                Password
                            </label>

                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="primary-button full-width"
                            disabled={loading}
                        >
                            {loading
                                ? 'Signing in...'
                                : 'Sign In'}
                        </button>

                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="app">

            <header className="navbar">
                <div className="navbar-inner">

                    <div className="brand-section">
                        <div className="brand-icon">
                            P
                        </div>

                        <div>
                            <h1>
                                Product Management
                            </h1>

                            <p>
                                Inventory Dashboard
                            </p>
                        </div>
                    </div>

                    <button
                        className="logout-button"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>
            </header>

            <main className="dashboard">

                <section className="page-header">

                    <div>
                        <span className="eyebrow">
                            PRODUCT MANAGEMENT
                        </span>

                        <h2>
                            Product Inventory
                        </h2>

                        <p>
                            Manage your products through
                            the LavaLust API.
                        </p>
                    </div>

                    <button
                        className="secondary-button"
                        onClick={getProducts}
                        disabled={loading}
                    >
                        Refresh
                    </button>

                </section>

                {message && (
                    <div className="alert alert-success">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                <section className="content-grid">

                    <div className="form-card">

                        <div className="card-header">
                            <div>

                                <span className="eyebrow">
                                    {editingId
                                        ? 'UPDATE'
                                        : 'CREATE'}
                                </span>

                                <h3>
                                    {editingId
                                        ? 'Update Product'
                                        : 'Add Product'}
                                </h3>

                            </div>
                        </div>

                        <form onSubmit={saveProduct}>

                            <div className="form-group">
                                <label htmlFor="productName">
                                    Product Name
                                </label>

                                <input
                                    id="productName"
                                    type="text"
                                    value={productName}
                                    onChange={(event) =>
                                        setProductName(
                                            event.target.value
                                        )
                                    }
                                    placeholder="e.g. Matcha Latte"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">
                                    Description
                                </label>

                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(event) =>
                                        setDescription(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Enter product description"
                                    rows="4"
                                />
                            </div>

                            <div className="form-row">

                                <div className="form-group">
                                    <label htmlFor="price">
                                        Price
                                    </label>

                                    <input
                                        id="price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={price}
                                        onChange={(event) =>
                                            setPrice(
                                                event.target.value
                                            )
                                        }
                                        placeholder="0.00"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="quantity">
                                        Quantity
                                    </label>

                                    <input
                                        id="quantity"
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
                                </div>

                            </div>

                            <div className="form-actions">

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={loading}
                                >
                                    {loading
                                        ? 'Saving...'
                                        : editingId
                                        ? 'Update Product'
                                        : 'Add Product'}
                                </button>

                                {editingId && (
                                    <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={resetForm}
                                    >
                                        Cancel
                                    </button>
                                )}

                            </div>

                        </form>
                    </div>

                    <div className="table-card">

                        <div className="card-header">

                            <div>
                                <span className="eyebrow">
                                    INVENTORY
                                </span>

                                <h3>
                                    Products
                                </h3>
                            </div>

                            <div className="product-count">
                                {products.length} products
                            </div>

                        </div>

                        {loading && products.length === 0 ? (

                            <div className="empty-state">
                                Loading products...
                            </div>

                        ) : products.length === 0 ? (

                            <div className="empty-state">
                                No products found.
                            </div>

                        ) : (

                            <div className="table-wrapper">

                                <table>

                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Product</th>
                                            <th>Description</th>
                                            <th>Price</th>
                                            <th>Quantity</th>
                                            <th>Actions</th>
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

                                                    <td className="id-cell">
                                                        #{product.id}
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {
                                                                product.product_name
                                                            }
                                                        </strong>
                                                    </td>

                                                    <td className="description-cell">
                                                        {
                                                            product.description ||
                                                            '—'
                                                        }
                                                    </td>

                                                    <td>
                                                        ₱
                                                        {Number(
                                                            product.price
                                                        ).toFixed(
                                                            2
                                                        )}
                                                    </td>

                                                    <td>
                                                        <span className="quantity-badge">
                                                            {
                                                                product.quantity
                                                            }
                                                        </span>
                                                    </td>

                                                    <td>

                                                        <div className="actions">

                                                            <button
                                                                className="edit-button"
                                                                onClick={() =>
                                                                    editProduct(
                                                                        product
                                                                    )
                                                                }
                                                            >
                                                                Edit
                                                            </button>

                                                            <button
                                                                className="delete-button"
                                                                onClick={() =>
                                                                    deleteProduct(
                                                                        product.id
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

                    </div>

                </section>

            </main>

        </div>
    );
}

export default App;